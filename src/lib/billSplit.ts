// Bill splitting orchestration service
// Coordinates all the MUST-have requirements into a complete flow

import { Receipt, Participant, StoredKey } from '@/types/models';
import { FxManager, FxRate } from './fx';
import { storage, StoredReceipt } from './storage';
import { EventManager, PaymentRequestEventData } from './events';
import { IdGenerator, HashManager } from './ids';
import { NostrClient } from './nostr';
import { CryptoManager } from './crypto';
import { relayManager } from './relays';
import { contactManager } from './contacts';
import { utils } from 'nostr-tools';

export interface BillSplitRequest {
  imageBlob: Blob | null;
  totalFiat: number;
  currency: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
  participants: Array<{
    pubkey: string;
    shareSats: number;
  }>;
  flow: 'i-pay-all' | 'they-pay-all' | 'split';
  datetime: Date;
}

export interface BillSplitResult {
  success: boolean;
  receiptId: string;
  requestId: string;
  eventId?: string;
  error?: string;
  fxRate: FxRate;
}

export class BillSplitService {
  private eventManager: EventManager;

  constructor() {
    this.eventManager = new EventManager();
  }

  // Main orchestration method - implements the complete flow
  async createBillSplitRequest(
    request: BillSplitRequest,
    devicePassword: string,
    storedKey: StoredKey
  ): Promise<BillSplitResult> {
    try {
      // Step 1: Get FX rate (REQ-CUR-001, REQ-CUR-002)
      const fxRate = await FxManager.getCurrentRate(request.currency);
      
      // Step 2: Convert to sats (REQ-CUR-003 - round down)
      const totalSats = FxManager.convertToSats(request.totalFiat, fxRate);
      
      // Step 3: Generate IDs (REQ-EVT-003)
      const receiptId = IdGenerator.generateReceiptId();
      const requestId = IdGenerator.generateRequestId();
      
      // Step 4: Hash receipt image or generate ID if no image (REQ-EVT-003)
      const rhash = request.imageBlob 
        ? await HashManager.hashReceiptImage(request.imageBlob)
        : IdGenerator.generateReceiptId();
      
      // Step 5: Prepare participants with proper status
      const participants: Participant[] = request.participants.map(p => ({
        pubkey: p.pubkey,
        shareSats: p.shareSats,
        paidSats: 0,
        status: 'pending' as const
      }));
      
      // Step 6: Create receipt object
      const receipt: Receipt = {
        id: receiptId,
        createdAt: request.datetime.getTime(),
        imageUri: `receipt_${receiptId}.png`, // Will be renamed after event publish
        rhash,
        amountFiat: request.totalFiat,
        currency: request.currency,
        amountSats: totalSats,
        fxRate: fxRate.rate,
        fxSource: fxRate.source,
        fxTimestamp: fxRate.timestamp,
        mealType: request.mealType,
        participants,
        splitJson: JSON.stringify({
          flow: request.flow,
          participants: participants.map(p => ({
            pubkey: p.pubkey,
            shareSats: p.shareSats
          }))
        }),
        flow: request.flow
      };
      
      // Step 7: Store receipt and image locally (REQ-REC-004, REQ-STO-001)
      const storedReceipt: StoredReceipt = {
        ...receipt,
        syncStatus: 'local',
        imageBlob: request.imageBlob
      };
      
      await storage.saveReceipt(storedReceipt);
      
      // Only save image if one was provided
      if (request.imageBlob) {
        await storage.saveImage(receiptId, request.imageBlob);
      }
      
      // Step 8: Add audit entry (REQ-LOG-001)
      await storage.addAuditEntry({
        action: 'create',
        receiptId,
        details: {
          totalFiat: request.totalFiat,
          currency: request.currency,
          totalSats,
          participantCount: participants.length,
          flow: request.flow
        }
      });
      
      // Step 9: Decrypt private key for signing
      const encryptedPrivateKey = storedKey.encryptedPrivateKey;
      const privateKeyHex = await CryptoManager.decryptData(encryptedPrivateKey, devicePassword);
      const privateKeyBytes = utils.hexToBytes(privateKeyHex);
      
      // Step 10: Create and sign Nostr event (REQ-EVT-001, REQ-EVT-003)
      const eventData: PaymentRequestEventData = {
        requestId,
        receipt,
        fxRate,
        mealType: request.mealType
      };
      
      const unsignedEvent = this.eventManager.createPaymentRequestEvent(eventData, storedKey.pubkey);
      const signedEvent = NostrClient.signEvent(unsignedEvent, privateKeyBytes);
      
      // Step 11: Set up relays and publish (REQ-REL-001)
      this.eventManager.setRelays(relayManager.getWriteRelays().map(r => r.url));
      const publishResult = await this.eventManager.publishEvent(signedEvent);
      
      if (publishResult.success && publishResult.eventId) {
        // Step 12: Update receipt with event ID and rename image (REQ-REC-005)
        await storage.updateReceiptEventId(receiptId, publishResult.eventId);
        await storage.renameReceiptImage(receiptId, publishResult.eventId);
        
        // Step 13: Add publish audit entry
        await storage.addAuditEntry({
          action: 'publish',
          receiptId,
          eventId: publishResult.eventId,
          details: {
            relayResults: publishResult.relayResults
          }
        });
        
        // Step 14: Send DMs to recipients (REQ-EVT-002 - SHOULD)
        await this.sendRecipientNotifications(
          eventData,
          publishResult.eventId,
          privateKeyBytes,
          storedKey.pubkey
        );
        
        return {
          success: true,
          receiptId,
          requestId,
          eventId: publishResult.eventId,
          fxRate
        };
      } else {
        // Mark as failed but keep locally
        await storage.updateReceiptStatus(receiptId, 'failed');
        
        return {
          success: false,
          receiptId,
          requestId,
          error: publishResult.error || 'Failed to publish event',
          fxRate
        };
      }
      
    } catch (error) {
      console.error('Bill split creation failed:', error);
      return {
        success: false,
        receiptId: '',
        requestId: '',
        error: (error as Error).message,
        fxRate: FxManager.createManualRate(request.currency, 0)
      };
    }
  }

  // REQ-EVT-002: Send DMs to recipients (SHOULD requirement)
  private async sendRecipientNotifications(
    eventData: PaymentRequestEventData,
    eventId: string,
    privateKey: Uint8Array,
    senderPubkey: string
  ): Promise<void> {
    for (const participant of eventData.receipt.participants) {
      try {
        const dmEvent = await this.eventManager.createRecipientDM(
          participant,
          eventData,
          eventId,
          privateKey,
          senderPubkey
        );
        
        const signedDM = NostrClient.signEvent(dmEvent, privateKey);
        await this.eventManager.publishEvent(signedDM);
      } catch (error) {
        console.warn(`Failed to send DM to ${participant.pubkey}:`, error);
        // Continue with other recipients - this is SHOULD not MUST
      }
    }
  }

  // REQ-EVT-004: Mark participant as paid
  async markParticipantPaid(
    receiptId: string,
    pubkey: string,
    paidSats: number,
    method: 'zap' | 'manual',
    devicePassword: string,
    storedKey: StoredKey
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const receipt = await storage.getReceipt(receiptId);
      if (!receipt || !receipt.noteEventId) {
        throw new Error('Receipt not found or not published');
      }

      // Update participant payment status
      await storage.updateParticipantPayment(receiptId, pubkey, paidSats, method);

      // Create and publish reply event (REQ-EVT-004)
      const participant = receipt.participants.find(p => p.pubkey === pubkey);
      if (!participant) {
        throw new Error('Participant not found');
      }

      const encryptedPrivateKey = storedKey.encryptedPrivateKey;
      const privateKeyHex = await CryptoManager.decryptData(encryptedPrivateKey, devicePassword);
      const privateKeyBytes = utils.hexToBytes(privateKeyHex);

      // Extract request ID from split JSON
      const splitData = JSON.parse(receipt.splitJson);
      const requestId = receipt.id; // Using receipt ID as fallback

      const replyEvent = this.eventManager.createPaidReplyEvent(
        receipt.noteEventId,
        requestId,
        { ...participant, paidSats },
        method,
        storedKey.pubkey
      );

      const signedReply = NostrClient.signEvent(replyEvent, privateKeyBytes);
      const publishResult = await this.eventManager.publishEvent(signedReply);

      if (publishResult.success) {
        await storage.addAuditEntry({
          action: 'mark_paid',
          receiptId,
          eventId: publishResult.eventId,
          details: {
            pubkey,
            paidSats,
            method
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to mark participant paid:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Calculate equal splits with proper rounding (REQ-CUR-003)
  static calculateEqualSplit(totalSats: number, participantCount: number): number[] {
    const baseShare = Math.floor(totalSats / participantCount);
    const remainder = totalSats % participantCount;
    
    const shares = new Array(participantCount).fill(baseShare);
    
    // Distribute remainder (always round down total)
    for (let i = 0; i < remainder; i++) {
      shares[i] += 1;
    }
    
    return shares;
  }

  // Validate split totals
  static validateSplit(totalSats: number, participantShares: number[]): boolean {
    const sum = participantShares.reduce((a, b) => a + b, 0);
    return sum <= totalSats; // Allow under-allocation due to rounding down
  }

  // Initialize all services
  async initialize(userPubkey?: string): Promise<void> {
    await storage.init();
    await relayManager.initialize(userPubkey);
    
    if (userPubkey) {
      await contactManager.loadFollowList(userPubkey);
    }
  }

  // Clean up
  disconnect(): void {
    this.eventManager.disconnect();
    relayManager.disconnect();
  }
}

// Singleton instance
export const billSplitService = new BillSplitService();
