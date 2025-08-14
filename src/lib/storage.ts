import Dexie, { type EntityTable } from 'dexie';
import type { Receipt, Contact, Settings } from '../types/models';

interface LunchWithGarethDB extends Dexie {
  receipts: EntityTable<Receipt, 'id'>;
  contacts: EntityTable<Contact, 'pubkey'>;
  settings: EntityTable<Settings & { id: number }, 'id'>;
  keys: EntityTable<{ id: number; encryptedPrivateKey: string; publicKey: string }, 'id'>;
}

const db = new Dexie('LunchWithGarethDB') as LunchWithGarethDB;

db.version(1).stores({
  receipts: '++id, createdAt, noteEventId, mealType, flow',
  contacts: '&pubkey, name, nip05',
  settings: '++id',
  keys: '++id'
});

export class StorageService {
  // Receipt operations
  async saveReceipt(receipt: Receipt): Promise<string> {
    return await db.receipts.add(receipt);
  }

  async getReceipt(id: string): Promise<Receipt | undefined> {
    return await db.receipts.get(id);
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return await db.receipts.orderBy('createdAt').reverse().toArray();
  }

  async updateReceipt(id: string, updates: Partial<Receipt>): Promise<void> {
    await db.receipts.update(id, updates);
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.receipts.delete(id);
  }

  // Contact operations
  async saveContact(contact: Contact): Promise<void> {
    await db.contacts.put(contact);
  }

  async getContact(pubkey: string): Promise<Contact | undefined> {
    return await db.contacts.get(pubkey);
  }

  async getAllContacts(): Promise<Contact[]> {
    return await db.contacts.toArray();
  }

  async updateContact(pubkey: string, updates: Partial<Contact>): Promise<void> {
    await db.contacts.update(pubkey, updates);
  }

  async deleteContact(pubkey: string): Promise<void> {
    await db.contacts.delete(pubkey);
  }

  // Settings operations
  async saveSettings(settings: Settings): Promise<void> {
    const existing = await db.settings.toArray();
    if (existing.length > 0) {
      await db.settings.update(1, { ...settings });
    } else {
      await db.settings.add({ id: 1, ...settings });
    }
  }

  async getSettings(): Promise<Settings | undefined> {
    const settings = await db.settings.get(1);
    if (!settings) return undefined;
    const { id, ...settingsData } = settings;
    return settingsData;
  }

  // Key operations
  async saveKeys(encryptedPrivateKey: string, publicKey: string): Promise<void> {
    await db.keys.clear(); // Only store one key pair
    await db.keys.add({ id: 1, encryptedPrivateKey, publicKey });
  }

  async getKeys(): Promise<{ encryptedPrivateKey: string; publicKey: string } | undefined> {
    const keys = await db.keys.get(1);
    if (!keys) return undefined;
    const { id, ...keyData } = keys;
    return keyData;
  }

  async clearKeys(): Promise<void> {
    await db.keys.clear();
  }

  // Search operations
  async searchReceipts(query: string, status?: string): Promise<Receipt[]> {
    let receipts = await this.getAllReceipts();
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      receipts = receipts.filter(receipt => 
        receipt.mealType.toLowerCase().includes(lowerQuery) ||
        receipt.participants.some(p => p.pubkey.includes(lowerQuery))
      );
    }

    if (status) {
      receipts = receipts.filter(receipt => {
        const totalPaid = receipt.participants.reduce((sum, p) => sum + p.paidSats, 0);
        const totalOwed = receipt.participants.reduce((sum, p) => sum + p.shareSats, 0);
        
        switch (status) {
          case 'open':
            return totalPaid === 0;
          case 'partial':
            return totalPaid > 0 && totalPaid < totalOwed;
          case 'settled':
            return totalPaid >= totalOwed;
          default:
            return true;
        }
      });
    }

    return receipts;
  }
}

export const storageService = new StorageService();