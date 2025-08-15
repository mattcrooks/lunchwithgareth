// ID generation and hashing utilities
// REQ-EVT-003: Include unique request ID, receipt hash

export class IdGenerator {
  // REQ-EVT-003: Generate unique request ID using crypto.randomUUID (time-ordered with timestamp)
  static generateRequestId(): string {
    // Use crypto.randomUUID with timestamp prefix for ordering
    const timestamp = Date.now().toString(36);
    const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    return `${timestamp}_${random}`;
  }

  // Generate receipt ID
  static generateReceiptId(): string {
    return crypto.randomUUID();
  }
}

export class HashManager {
  // REQ-EVT-003: Calculate receipt hash (rhash)
  static async hashReceiptImage(imageBlob: Blob): Promise<string> {
    const arrayBuffer = await imageBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Hash arbitrary data
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
