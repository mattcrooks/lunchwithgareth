// Local storage management using IndexedDB
// REQ-STO-001: Local persistence only for MVP

import { Receipt, Settings, Participant } from '@/types/models';

export interface StoredReceipt extends Receipt {
  // Additional metadata for local storage
  imageBlob?: Blob;
  syncStatus: 'local' | 'published' | 'failed';
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: 'create' | 'update' | 'mark_paid' | 'publish';
  receiptId: string;
  eventId?: string;
  details: Record<string, unknown>;
}

class StorageManager {
  private dbName = 'lunch-with-gareth-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create receipts store
        if (!db.objectStoreNames.contains('receipts')) {
          const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
          receiptStore.createIndex('createdAt', 'createdAt');
          receiptStore.createIndex('mealType', 'mealType');
          receiptStore.createIndex('syncStatus', 'syncStatus');
        }
        
        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        
        // Create audit log store
        if (!db.objectStoreNames.contains('auditLog')) {
          const auditStore = db.createObjectStore('auditLog', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp');
          auditStore.createIndex('receiptId', 'receiptId');
        }
        
        // Create image store for receipt images
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Receipt management
  async saveReceipt(receipt: StoredReceipt): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['receipts'], 'readwrite');
    const store = transaction.objectStore('receipts');
    
    return new Promise((resolve, reject) => {
      const request = store.put(receipt);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getReceipt(id: string): Promise<StoredReceipt | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['receipts'], 'readonly');
    const store = transaction.objectStore('receipts');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllReceipts(): Promise<StoredReceipt[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['receipts'], 'readonly');
    const store = transaction.objectStore('receipts');
    const index = store.index('createdAt');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result.reverse()); // Most recent first
      request.onerror = () => reject(request.error);
    });
  }

  async updateReceiptStatus(id: string, status: StoredReceipt['syncStatus']): Promise<void> {
    const receipt = await this.getReceipt(id);
    if (!receipt) {
      throw new Error(`Receipt ${id} not found`);
    }
    
    receipt.syncStatus = status;
    await this.saveReceipt(receipt);
  }

  async updateReceiptEventId(id: string, eventId: string): Promise<void> {
    const receipt = await this.getReceipt(id);
    if (!receipt) {
      throw new Error(`Receipt ${id} not found`);
    }
    
    receipt.noteEventId = eventId;
    receipt.syncStatus = 'published';
    await this.saveReceipt(receipt);
  }

  // REQ-REC-005: File naming convention rcpt_{eventId}.png
  async renameReceiptImage(receiptId: string, eventId: string): Promise<void> {
    const receipt = await this.getReceipt(receiptId);
    if (!receipt) return;
    
    // Update the imageUri to reflect the new naming convention
    const newImageUri = `rcpt_${eventId}.png`;
    receipt.imageUri = newImageUri;
    await this.saveReceipt(receipt);
  }

  // Image storage (REQ-REC-004: Store original image locally)
  async saveImage(id: string, blob: Blob): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id, blob });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(id: string): Promise<Blob | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Settings management
  async saveSettings(settings: Settings): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'app_settings', ...settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSettings(): Promise<Settings | null> {
    const db = this.ensureDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    
    return new Promise((resolve, reject) => {
      const request = store.get('app_settings');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { id: _id, ...settings } = result;
          resolve(settings as Settings);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Audit log (REQ-LOG-001: Mirror edits as events)
  async addAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(['auditLog'], 'readwrite');
    const store = transaction.objectStore('auditLog');
    
    const fullEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...entry
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(fullEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAuditLog(receiptId?: string): Promise<AuditLogEntry[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(['auditLog'], 'readonly');
    const store = transaction.objectStore('auditLog');
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (receiptId) {
        const index = store.index('receiptId');
        request = index.getAll(receiptId);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        const results = request.result;
        // Sort by timestamp, most recent first
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Participant payment tracking
  async updateParticipantPayment(
    receiptId: string, 
    pubkey: string, 
    paidSats: number,
    method: 'zap' | 'manual' = 'manual'
  ): Promise<void> {
    const receipt = await this.getReceipt(receiptId);
    if (!receipt) {
      throw new Error(`Receipt ${receiptId} not found`);
    }
    
    const participant = receipt.participants.find(p => p.pubkey === pubkey);
    if (!participant) {
      throw new Error(`Participant ${pubkey} not found in receipt ${receiptId}`);
    }
    
    const oldPaidSats = participant.paidSats;
    participant.paidSats = paidSats;
    
    // Update status based on payment
    if (paidSats >= participant.shareSats) {
      participant.status = 'paid';
    } else if (paidSats > 0) {
      participant.status = 'partial';
    } else {
      participant.status = 'pending';
    }
    
    await this.saveReceipt(receipt);
    
    // Add audit entry
    await this.addAuditEntry({
      action: 'mark_paid',
      receiptId,
      details: {
        pubkey,
        oldPaidSats,
        newPaidSats: paidSats,
        method
      }
    });
  }
}

// Singleton instance
export const storage = new StorageManager();
