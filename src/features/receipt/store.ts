import { create } from 'zustand';
import type { Receipt } from '../../types/models';
import { storageService } from '../../lib/storage';

interface ReceiptStore {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  
  loadReceipts: () => Promise<void>;
  addReceipt: (receipt: Receipt) => Promise<void>;
  updateReceipt: (id: string, updates: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  searchReceipts: (query: string, status?: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  receipts: [],
  loading: false,
  error: null,

  loadReceipts: async () => {
    try {
      set({ loading: true, error: null });
      const receipts = await storageService.getAllReceipts();
      set({ receipts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load receipts', loading: false });
    }
  },

  addReceipt: async (receipt: Receipt) => {
    try {
      set({ loading: true, error: null });
      await storageService.saveReceipt(receipt);
      const { receipts } = get();
      set({ receipts: [receipt, ...receipts], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add receipt', loading: false });
      throw error;
    }
  },

  updateReceipt: async (id: string, updates: Partial<Receipt>) => {
    try {
      set({ loading: true, error: null });
      await storageService.updateReceipt(id, updates);
      const { receipts } = get();
      const updatedReceipts = receipts.map(r => 
        r.id === id ? { ...r, ...updates } : r
      );
      set({ receipts: updatedReceipts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update receipt', loading: false });
      throw error;
    }
  },

  deleteReceipt: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await storageService.deleteReceipt(id);
      const { receipts } = get();
      const filteredReceipts = receipts.filter(r => r.id !== id);
      set({ receipts: filteredReceipts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete receipt', loading: false });
      throw error;
    }
  },

  searchReceipts: async (query: string, status?: string) => {
    try {
      set({ loading: true, error: null });
      const receipts = await storageService.searchReceipts(query, status);
      set({ receipts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to search receipts', loading: false });
    }
  }
}));