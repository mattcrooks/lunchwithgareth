import { create } from 'zustand';
import type { Settings } from '../../types/models';
import { storageService } from '../../lib/storage';

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  relays: [
    'wss://relay.damus.io',
    'wss://nostr.wine',
    'wss://relay.nostr.info',
    'wss://offchain.pub'
  ],
  theme: 'system',
  biometricEnabled: true,
  defaultMealType: 'lunch'
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  loadSettings: async () => {
    try {
      set({ loading: true, error: null });
      const settings = await storageService.getSettings();
      set({ settings: settings || defaultSettings, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load settings', 
        loading: false,
        settings: defaultSettings
      });
    }
  },

  updateSettings: async (updates: Partial<Settings>) => {
    try {
      set({ loading: true, error: null });
      const { settings } = get();
      const newSettings = { ...(settings || defaultSettings), ...updates };
      await storageService.saveSettings(newSettings);
      set({ settings: newSettings, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update settings', loading: false });
      throw error;
    }
  }
}));