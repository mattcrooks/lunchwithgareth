export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function generateRequestId(): string {
  return 'req_' + generateId();
}

export function generateReceiptHash(imageData: string): string {
  // Simple hash function for demo purposes
  // In a real app, you'd use a proper cryptographic hash
  let hash = 0;
  for (let i = 0; i < imageData.length; i++) {
    const char = imageData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export function isValidPubkey(pubkey: string): boolean {
  return /^[0-9a-f]{64}$/i.test(pubkey);
}

export function isValidNsec(nsec: string): boolean {
  return nsec.startsWith('nsec1') && nsec.length === 63;
}

export function isValidNpub(npub: string): boolean {
  return npub.startsWith('npub1') && npub.length === 63;
}