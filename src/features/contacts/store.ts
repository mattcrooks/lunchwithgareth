import { create } from 'zustand';
import type { Contact } from '../../types/models';
import { storageService } from '../../lib/storage';

interface ContactStore {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  
  loadContacts: () => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  updateContact: (pubkey: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (pubkey: string) => Promise<void>;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,

  loadContacts: async () => {
    try {
      set({ loading: true, error: null });
      const contacts = await storageService.getAllContacts();
      set({ contacts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load contacts', loading: false });
    }
  },

  addContact: async (contact: Contact) => {
    try {
      set({ loading: true, error: null });
      await storageService.saveContact(contact);
      const { contacts } = get();
      set({ contacts: [...contacts, contact], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add contact', loading: false });
      throw error;
    }
  },

  updateContact: async (pubkey: string, updates: Partial<Contact>) => {
    try {
      set({ loading: true, error: null });
      await storageService.updateContact(pubkey, updates);
      const { contacts } = get();
      const updatedContacts = contacts.map(c => 
        c.pubkey === pubkey ? { ...c, ...updates } : c
      );
      set({ contacts: updatedContacts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update contact', loading: false });
      throw error;
    }
  },

  deleteContact: async (pubkey: string) => {
    try {
      set({ loading: true, error: null });
      await storageService.deleteContact(pubkey);
      const { contacts } = get();
      const filteredContacts = contacts.filter(c => c.pubkey !== pubkey);
      set({ contacts: filteredContacts, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete contact', loading: false });
      throw error;
    }
  }
}));