// Relay management for Nostr
// REQ-REL-001, REQ-REL-002: Preload defaults, fetch user relay list, allow editing

import { Relay } from '@/types/models';
import { storage } from './storage';

export interface RelayInfo {
  url: string;
  name?: string;
  description?: string;
  supported_nips?: number[];
  limitation?: {
    max_message_length?: number;
    max_subscriptions?: number;
    max_filters?: number;
  };
}

// REQ-REL-001: Default relays
export const DEFAULT_RELAYS: Relay[] = [
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.nostr.band', read: true, write: true },
  { url: 'wss://nostr.wine', read: true, write: true },
  { url: 'wss://relay.snort.social', read: true, write: true }
];

export class RelayManager {
  private relays: Relay[] = [];
  private connections: Map<string, WebSocket> = new Map();

  constructor() {
    this.relays = [...DEFAULT_RELAYS];
  }

  // REQ-REL-001: Initialize with defaults and fetch user relay list
  async initialize(userPubkey?: string): Promise<void> {
    // Load saved relays from storage
    const settings = await storage.getSettings();
    if (settings?.relays && settings.relays.length > 0) {
      this.relays = settings.relays;
    } else {
      this.relays = [...DEFAULT_RELAYS];
    }

    // REQ-REL-002: Fetch user relay list from network if pubkey provided
    if (userPubkey) {
      try {
        const userRelays = await this.fetchUserRelayList(userPubkey);
        if (userRelays.length > 0) {
          this.mergeUserRelays(userRelays);
          await this.saveRelays();
        }
      } catch (error) {
        console.warn('Failed to fetch user relay list:', error);
        // Continue with defaults - this is graceful degradation
      }
    }
  }

  // Fetch user's relay list (NIP-65)
  private async fetchUserRelayList(pubkey: string): Promise<Relay[]> {
    const relayUrls = this.getWriteRelays().map(r => r.url);
    const userRelays: Relay[] = [];

    for (const relayUrl of relayUrls) {
      try {
        const relays = await this.queryRelayListFromRelay(relayUrl, pubkey);
        userRelays.push(...relays);
      } catch (error) {
        console.warn(`Failed to fetch relay list from ${relayUrl}:`, error);
        continue;
      }
    }

    return this.deduplicateRelays(userRelays);
  }

  private async queryRelayListFromRelay(relayUrl: string, pubkey: string): Promise<Relay[]> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl);
      const relays: Relay[] = [];
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout'));
      }, 10000);

      ws.onopen = () => {
        // Subscribe to relay list events (kind 10002)
        const subscription = JSON.stringify([
          'REQ',
          'relay_list',
          {
            kinds: [10002],
            authors: [pubkey],
            limit: 1
          }
        ]);
        ws.send(subscription);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message[0] === 'EVENT') {
            const nostrEvent = message[2];
            
            // Parse relay list from tags
            nostrEvent.tags.forEach((tag: string[]) => {
              if (tag[0] === 'r' && tag[1]) {
                const url = tag[1];
                const type = tag[2];
                
                relays.push({
                  url,
                  read: !type || type === 'read',
                  write: !type || type === 'write'
                });
              }
            });
          } else if (message[0] === 'EOSE') {
            clearTimeout(timeout);
            ws.close();
            resolve(relays);
          }
        } catch (error) {
          clearTimeout(timeout);
          ws.close();
          reject(error);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error'));
      };
    });
  }

  private mergeUserRelays(userRelays: Relay[]): void {
    const existingUrls = new Set(this.relays.map(r => r.url));
    
    // Add new user relays
    userRelays.forEach(relay => {
      if (!existingUrls.has(relay.url)) {
        this.relays.push(relay);
      }
    });

    // Limit total relays to reasonable number
    if (this.relays.length > 10) {
      this.relays = this.relays.slice(0, 10);
    }
  }

  private deduplicateRelays(relays: Relay[]): Relay[] {
    const seen = new Set<string>();
    return relays.filter(relay => {
      if (seen.has(relay.url)) {
        return false;
      }
      seen.add(relay.url);
      return true;
    });
  }

  // Relay management methods
  getRelays(): Relay[] {
    return [...this.relays];
  }

  getReadRelays(): Relay[] {
    return this.relays.filter(r => r.read);
  }

  getWriteRelays(): Relay[] {
    return this.relays.filter(r => r.write);
  }

  addRelay(relay: Relay): void {
    const exists = this.relays.some(r => r.url === relay.url);
    if (!exists) {
      this.relays.push(relay);
    }
  }

  removeRelay(url: string): void {
    this.relays = this.relays.filter(r => r.url !== url);
  }

  updateRelay(url: string, updates: Partial<Relay>): void {
    const index = this.relays.findIndex(r => r.url === url);
    if (index !== -1) {
      this.relays[index] = { ...this.relays[index], ...updates };
    }
  }

  async saveRelays(): Promise<void> {
    const settings = await storage.getSettings() || {
      relays: [],
      theme: 'system' as const,
      biometricEnabled: true,
      defaultMealType: 'Lunch' as const,
      defaultCurrency: 'USD'
    };
    
    settings.relays = this.relays;
    await storage.saveSettings(settings);
  }

  // Test relay connectivity
  async testRelay(url: string): Promise<{ success: boolean; info?: RelayInfo; error?: string }> {
    try {
      const ws = new WebSocket(url);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, error: 'Connection timeout' });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({ success: true });
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({ success: false, error: 'Connection failed' });
        };
      });
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Clean up connections
  disconnect(): void {
    this.connections.forEach(ws => ws.close());
    this.connections.clear();
  }
}

// Singleton instance
export const relayManager = new RelayManager();
