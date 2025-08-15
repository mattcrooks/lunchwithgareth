export interface NostrProfile {
  pubkey: string;
  name?: string;
  displayName?: string;
  picture?: string;
  nip05?: string;
  about?: string;
}

export interface StoredKey {
  pubkey: string;
  encryptedPrivateKey: string;
  createdAt: number;
  lastUsed: number;
}

export interface Relay {
  url: string;
  read: boolean;
  write: boolean;
}

export interface Receipt {
  id: string;
  createdAt: number;
  imageUri: string;
  rhash: string;
  amountFiat: number;
  currency: string;
  amountSats: number;
  fxRate: number;
  fxSource: string;
  fxTimestamp: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
  participants: Participant[];
  splitJson: string;
  flow: 'i-pay-all' | 'they-pay-all' | 'split';
  noteEventId?: string;
}

export interface Participant {
  pubkey: string;
  shareSats: number;
  paidSats: number;
  status: 'pending' | 'partial' | 'paid';
}

export interface Settings {
  relays: Relay[];
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
  defaultMealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
  defaultCurrency: string;
}