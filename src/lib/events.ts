// Nostr event creation and publishing
// REQ-EVT-001, REQ-EVT-002, REQ-EVT-003, REQ-EVT-004

import { Event, UnsignedEvent, nip04 } from 'nostr-tools';
import { NostrClient } from './nostr';
import { FxRate } from './fx';
import { Receipt, Participant } from '@/types/models';
import { IdGenerator } from './ids';

export interface EventPublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
  relayResults: { relay: string; success: boolean; error?: string }[];
}

export interface PaymentRequestEventData {
  requestId: string;
  receipt: Receipt;
  fxRate: FxRate;
  mealType: string;
}

export class EventManager {
  private relays: string[] = [];
  private sockets: Map<string, WebSocket> = new Map();

  constructor(relays: string[] = []) {
    this.relays = relays;
  }

  setRelays(relays: string[]): void {
    this.relays = relays;
    // Close existing connections
    this.sockets.forEach(socket => socket.close());
    this.sockets.clear();
  }

  private async connectToRelay(relayUrl: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl);
      
      ws.onopen = () => {
        this.sockets.set(relayUrl, ws);
        resolve(ws);
      };
      
      ws.onerror = () => {
        reject(new Error(`Failed to connect to relay: ${relayUrl}`));
      };
      
      // Set a connection timeout
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error(`Connection timeout: ${relayUrl}`));
        }
      }, 5000);
    });
  }

  // REQ-EVT-001: Publish a public note containing request metadata and tags
  createPaymentRequestEvent(data: PaymentRequestEventData, pubkey: string): UnsignedEvent {
    const { requestId, receipt, fxRate, mealType } = data;
    
    // REQ-PRIV-001: Only generic meal type, no merchant/location
    const content = `${mealType} request`;
    
    const tags: string[][] = [
      // REQ-EVT-003: Required tags
      ['rid', requestId],
      ['rhash', receipt.rhash],
      ['amount', receipt.amountSats.toString()],
      ['ccy', receipt.currency],
      ['fx', ...this.formatFxRate(fxRate)],
      ['split', receipt.flow, this.encodeSplitData(receipt)],
      ['meal', mealType],
      ['privacy', 'no-location'],
      ['flow', receipt.flow]
    ];

    // Add recipient tags
    receipt.participants.forEach(participant => {
      tags.push(['p', participant.pubkey]);
    });

    const event = NostrClient.createEvent(content, 1, tags);
    event.pubkey = pubkey;
    
    return event;
  }

  // REQ-EVT-004: Reply event when marked paid
  createPaidReplyEvent(
    originalEventId: string, 
    requestId: string, 
    paidParticipant: Participant,
    method: 'zap' | 'manual',
    pubkey: string
  ): UnsignedEvent {
    const content = `Payment received: ${paidParticipant.paidSats} sats`;
    
    const tags: string[][] = [
      ['e', originalEventId, 'reply'],
      ['rid', requestId],
      ['paid', paidParticipant.pubkey, paidParticipant.paidSats.toString()],
      ['method', method]
    ];

    const event = NostrClient.createEvent(content, 1, tags);
    event.pubkey = pubkey;
    
    return event;
  }

  // REQ-EVT-002: Send per-recipient DM notifying share (SHOULD)
  async createRecipientDM(
    recipient: Participant,
    requestData: PaymentRequestEventData,
    requestEventId: string,
    senderPrivateKey: Uint8Array,
    senderPubkey: string
  ): Promise<UnsignedEvent> {
    const content = JSON.stringify({
      type: 'payment_request',
      requestId: requestData.requestId,
      mealType: requestData.mealType,
      yourShare: recipient.shareSats,
      totalAmount: requestData.receipt.amountSats,
      currency: requestData.receipt.currency,
      requestEventId,
      message: `You have a payment request for ${requestData.mealType}: ${recipient.shareSats} sats`
    });

    // Encrypt the content using NIP-04
    const encryptedContent = await nip04.encrypt(senderPrivateKey, recipient.pubkey, content);
    
    const tags: string[][] = [
      ['p', recipient.pubkey],
      ['rid', requestData.requestId]
    ];

    const event = NostrClient.createEvent(encryptedContent, 4, tags);
    event.pubkey = senderPubkey;
    
    return event;
  }

  // Publish event to relays
  async publishEvent(signedEvent: Event): Promise<EventPublishResult> {
    const results: { relay: string; success: boolean; error?: string }[] = [];
    let successCount = 0;

    const publishPromises = this.relays.map(async (relayUrl) => {
      try {
        const ws = await this.connectToRelay(relayUrl);
        
        return new Promise<void>((resolve) => {
          const eventMessage = JSON.stringify(['EVENT', signedEvent]);
          
          const timeout = setTimeout(() => {
            results.push({ relay: relayUrl, success: false, error: 'Timeout' });
            resolve();
          }, 10000);

          ws.onmessage = (event) => {
            try {
              const response = JSON.parse(event.data);
              if (response[0] === 'OK' && response[1] === signedEvent.id) {
                clearTimeout(timeout);
                if (response[2]) {
                  results.push({ relay: relayUrl, success: true });
                  successCount++;
                } else {
                  results.push({ relay: relayUrl, success: false, error: response[3] || 'Unknown error' });
                }
                resolve();
              }
            } catch (error) {
              clearTimeout(timeout);
              results.push({ relay: relayUrl, success: false, error: (error as Error).message });
              resolve();
            }
          };

          ws.send(eventMessage);
        });
      } catch (error) {
        results.push({ relay: relayUrl, success: false, error: (error as Error).message });
      }
    });

    await Promise.all(publishPromises);

    return {
      success: successCount > 0,
      eventId: successCount > 0 ? signedEvent.id : undefined,
      error: successCount === 0 ? 'Failed to publish to any relay' : undefined,
      relayResults: results
    };
  }

  // Utility methods
  private formatFxRate(fxRate: FxRate): string[] {
    return [
      fxRate.rate.toString(),
      fxRate.source,
      new Date(fxRate.timestamp).toISOString()
    ];
  }

  private encodeSplitData(receipt: Receipt): string {
    const splitData = {
      participants: receipt.participants.map(p => ({
        pubkey: p.pubkey,
        shareSats: p.shareSats
      })),
      flow: receipt.flow
    };
    
    return btoa(JSON.stringify(splitData));
  }

  // Clean up connections
  disconnect(): void {
    this.sockets.forEach(socket => socket.close());
    this.sockets.clear();
  }
}
