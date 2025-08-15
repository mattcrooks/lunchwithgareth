// Contact management for recipient selection
// REQ-CTC-001: Follow list (NIP-02), REQ-CTC-002: Manual entry and QR scan

import { NostrProfile } from '@/types/models';
import { relayManager } from './relays';

export interface Contact extends NostrProfile {
  isFollowing?: boolean;
  lastSeen?: number;
  addedManually?: boolean;
}

export class ContactManager {
  private contacts: Map<string, Contact> = new Map();
  private followList: Set<string> = new Set();

  // REQ-CTC-001: Load follow list from NIP-02
  async loadFollowList(userPubkey: string): Promise<void> {
    const writeRelays = relayManager.getWriteRelays().map(r => r.url);
    
    for (const relayUrl of writeRelays) {
      try {
        const follows = await this.fetchFollowsFromRelay(relayUrl, userPubkey);
        follows.forEach(pubkey => this.followList.add(pubkey));
        
        // If we got follows from any relay, also fetch their profiles
        if (follows.length > 0) {
          await this.fetchProfiles(follows);
          break; // Use first successful relay
        }
      } catch (error) {
        console.warn(`Failed to fetch follows from ${relayUrl}:`, error);
        continue;
      }
    }
  }

  private async fetchFollowsFromRelay(relayUrl: string, pubkey: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl);
      let follows: string[] = [];
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout'));
      }, 10000);

      ws.onopen = () => {
        // Subscribe to follow list events (kind 3)
        const subscription = JSON.stringify([
          'REQ',
          'follows',
          {
            kinds: [3],
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
            
            // Parse follows from tags
            follows = nostrEvent.tags
              .filter((tag: string[]) => tag[0] === 'p' && tag[1])
              .map((tag: string[]) => tag[1]);
              
          } else if (message[0] === 'EOSE') {
            clearTimeout(timeout);
            ws.close();
            resolve(follows);
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

  // Fetch profiles for a list of pubkeys
  async fetchProfiles(pubkeys: string[]): Promise<void> {
    const writeRelays = relayManager.getWriteRelays().map(r => r.url);
    
    for (const relayUrl of writeRelays) {
      try {
        const profiles = await this.fetchProfilesFromRelay(relayUrl, pubkeys);
        
        profiles.forEach(profile => {
          const contact: Contact = {
            ...profile,
            isFollowing: this.followList.has(profile.pubkey),
            lastSeen: Date.now()
          };
          this.contacts.set(profile.pubkey, contact);
        });
        
        if (profiles.length > 0) {
          break; // Use first successful relay
        }
      } catch (error) {
        console.warn(`Failed to fetch profiles from ${relayUrl}:`, error);
        continue;
      }
    }
  }

  private async fetchProfilesFromRelay(relayUrl: string, pubkeys: string[]): Promise<NostrProfile[]> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(relayUrl);
      const profiles: NostrProfile[] = [];
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(profiles); // Return what we have so far
      }, 15000);

      ws.onopen = () => {
        // Subscribe to profile events (kind 0) for the pubkeys
        const subscription = JSON.stringify([
          'REQ',
          'profiles',
          {
            kinds: [0],
            authors: pubkeys
          }
        ]);
        ws.send(subscription);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message[0] === 'EVENT') {
            const nostrEvent = message[2];
            
            try {
              const profileData = JSON.parse(nostrEvent.content);
              const profile: NostrProfile = {
                pubkey: nostrEvent.pubkey,
                name: profileData.name,
                displayName: profileData.display_name || profileData.displayName,
                picture: profileData.picture,
                nip05: profileData.nip05,
                about: profileData.about
              };
              
              profiles.push(profile);
            } catch (parseError) {
              console.warn('Failed to parse profile content:', parseError);
            }
          } else if (message[0] === 'EOSE') {
            clearTimeout(timeout);
            ws.close();
            resolve(profiles);
          }
        } catch (error) {
          console.warn('Error processing profile message:', error);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(profiles); // Return what we have
      };
    });
  }

  // REQ-CTC-002: Manual entry of pubkey
  async addContactByPubkey(pubkey: string): Promise<Contact | null> {
    // Validate pubkey format (basic check)
    if (!this.isValidPubkey(pubkey)) {
      throw new Error('Invalid pubkey format');
    }

    // Check if already exists
    if (this.contacts.has(pubkey)) {
      return this.contacts.get(pubkey)!;
    }

    // Try to fetch profile
    try {
      await this.fetchProfiles([pubkey]);
      const contact = this.contacts.get(pubkey);
      
      if (contact) {
        contact.addedManually = true;
        return contact;
      }
    } catch (error) {
      console.warn('Failed to fetch profile for manually added contact:', error);
    }

    // Create basic contact if profile fetch failed
    const basicContact: Contact = {
      pubkey,
      addedManually: true,
      lastSeen: Date.now()
    };
    
    this.contacts.set(pubkey, basicContact);
    return basicContact;
  }

  // REQ-CTC-002: QR scan support (validate and add)
  async addContactFromQR(qrData: string): Promise<Contact | null> {
    // Parse different QR formats
    let pubkey: string;
    
    if (qrData.startsWith('npub1')) {
      // Bech32 encoded pubkey
      try {
        pubkey = this.decodeBech32Pubkey(qrData);
      } catch (error) {
        throw new Error('Invalid npub format');
      }
    } else if (qrData.length === 64 && /^[0-9a-f]+$/i.test(qrData)) {
      // Raw hex pubkey
      pubkey = qrData.toLowerCase();
    } else if (qrData.startsWith('nostr:')) {
      // Nostr URI
      const match = qrData.match(/nostr:(npub1[a-z0-9]+)/);
      if (match) {
        pubkey = this.decodeBech32Pubkey(match[1]);
      } else {
        throw new Error('Invalid nostr URI format');
      }
    } else {
      throw new Error('Unrecognized QR code format');
    }

    return await this.addContactByPubkey(pubkey);
  }

  // Get contacts for selection
  getFollowList(): Contact[] {
    return Array.from(this.contacts.values())
      .filter(contact => contact.isFollowing)
      .sort((a, b) => (a.name || a.displayName || '').localeCompare(b.name || b.displayName || ''));
  }

  getAllContacts(): Contact[] {
    return Array.from(this.contacts.values())
      .sort((a, b) => {
        // Sort follows first, then manual adds, then by name
        if (a.isFollowing && !b.isFollowing) return -1;
        if (!a.isFollowing && b.isFollowing) return 1;
        return (a.name || a.displayName || '').localeCompare(b.name || b.displayName || '');
      });
  }

  getContact(pubkey: string): Contact | null {
    return this.contacts.get(pubkey) || null;
  }

  // Search contacts
  searchContacts(query: string): Contact[] {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.contacts.values()).filter(contact => {
      return (
        contact.name?.toLowerCase().includes(lowercaseQuery) ||
        contact.displayName?.toLowerCase().includes(lowercaseQuery) ||
        contact.nip05?.toLowerCase().includes(lowercaseQuery) ||
        contact.pubkey.toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  // Utility methods
  private isValidPubkey(pubkey: string): boolean {
    return /^[0-9a-f]{64}$/i.test(pubkey);
  }

  private decodeBech32Pubkey(npub: string): string {
    // Simple bech32 decode for npub (this is a simplified version)
    // In production, you'd use a proper bech32 library
    try {
      // This is a placeholder - you'd need proper bech32 decoding
      // For MVP, we'll throw an error to use hex pubkeys
      throw new Error('Bech32 decoding not implemented - please use hex pubkey');
    } catch (error) {
      throw new Error('Failed to decode npub format');
    }
  }

  // Get display name for a contact
  getDisplayName(pubkey: string): string {
    const contact = this.contacts.get(pubkey);
    if (!contact) {
      return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }

    return contact.displayName || contact.name || contact.nip05 || `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  }

  // Clear all contacts
  clear(): void {
    this.contacts.clear();
    this.followList.clear();
  }
}

// Singleton instance
export const contactManager = new ContactManager();
