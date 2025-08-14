import { generateSecretKey, getPublicKey, finalizeEvent, SimplePool, type Event } from 'nostr-tools';

export class NostrClient {
  private pool: SimplePool;
  private relays: string[] = [
    'wss://relay.damus.io',
    'wss://nostr.wine',
    'wss://relay.nostr.info',
    'wss://offchain.pub'
  ];

  constructor() {
    this.pool = new SimplePool();
  }

  generateKeyPair() {
    const privateKey = generateSecretKey();
    const publicKey = getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  async publishEvent(event: Partial<Event>, privateKey: Uint8Array): Promise<string> {
    const signedEvent = finalizeEvent(event as any, privateKey);
    
    const promises = this.pool.publish(this.relays, signedEvent);
    
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Publish timeout'));
        }
      }, 10000);

      // Wait for at least one successful publish
      Promise.allSettled(promises).then(results => {
        if (!resolved) {
          const success = results.some(result => result.status === 'fulfilled');
          resolved = true;
          clearTimeout(timeout);
          
          if (success) {
            resolve(signedEvent.id);
          } else {
            reject(new Error('All publish attempts failed'));
          }
        }
      });
    });
  }

  async fetchUserRelays(pubkey: string): Promise<string[]> {
    const events = await this.pool.querySync(this.relays, {
      kinds: [10002],
      authors: [pubkey],
      limit: 1
    });

    if (events.length === 0) return [];

    const relayList = events[0];
    return relayList.tags
      .filter(tag => tag[0] === 'r')
      .map(tag => tag[1]);
  }

  async fetchFollows(pubkey: string): Promise<string[]> {
    const events = await this.pool.querySync(this.relays, {
      kinds: [3],
      authors: [pubkey],
      limit: 1
    });

    if (events.length === 0) return [];

    const followList = events[0];
    return followList.tags
      .filter(tag => tag[0] === 'p')
      .map(tag => tag[1]);
  }

  async fetchProfiles(pubkeys: string[]): Promise<Record<string, any>> {
    const events = await this.pool.querySync(this.relays, {
      kinds: [0],
      authors: pubkeys
    });

    const profiles: Record<string, any> = {};
    events.forEach(event => {
      try {
        profiles[event.pubkey] = JSON.parse(event.content);
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    return profiles;
  }

  async subscribeToZaps(eventId: string, callback: (zap: Event) => void): Promise<() => void> {
    const sub = this.pool.subscribeMany(this.relays, [
      {
        kinds: [9735],
        '#e': [eventId]
      }
    ], {
      onevent: callback
    });

    return () => sub.close();
  }

  setRelays(relays: string[]) {
    this.relays = relays;
  }

  close() {
    this.pool.close(this.relays);
  }
}

export const nostrClient = new NostrClient();