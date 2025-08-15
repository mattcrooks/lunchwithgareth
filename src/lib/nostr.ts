import { generateSecretKey, getPublicKey, nip19, Event, UnsignedEvent, finalizeEvent } from 'nostr-tools';

export class NostrClient {
  static generateKeyPair() {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    return {
      privateKey: nip19.nsecEncode(sk),
      publicKey: nip19.npubEncode(pk),
      rawPrivateKey: sk,
      rawPublicKey: pk
    };
  }

  static decodeKey(key: string) {
    try {
      if (key.startsWith('nsec')) {
        const decoded = nip19.decode(key);
        return {
          privateKey: decoded.data as Uint8Array,
          publicKey: getPublicKey(decoded.data as Uint8Array)
        };
      } else if (key.startsWith('npub')) {
        const decoded = nip19.decode(key);
        return {
          publicKey: decoded.data as string
        };
      }
      throw new Error('Invalid key format');
    } catch (error) {
      throw new Error('Failed to decode Nostr key');
    }
  }

  static signEvent(event: UnsignedEvent, privateKey: Uint8Array): Event {
    return finalizeEvent(event, privateKey);
  }

  static createEvent(content: string, kind: number, tags: string[][] = []): UnsignedEvent {
    return {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
      pubkey: '' // Will be filled when signing
    };
  }
}