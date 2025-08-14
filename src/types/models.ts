export interface Receipt {
  id: string;
  createdAt: string;
  imageUri?: string;
  rhash?: string;
  amountFiat: number;
  currency: string;
  amountSats: number;
  fxRate: number;
  fxSource: string;
  fxTimestamp: string;
  mealType: string;
  participants: Participant[];
  splitJson: string;
  flow: 'split' | 'i-pay-all' | 'they-pay-all';
  noteEventId?: string;
}

export interface Participant {
  pubkey: string;
  shareSats: number;
  paidSats: number;
  status: 'pending' | 'partial' | 'paid' | 'overpaid';
}

export interface Settings {
  relays: string[];
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
  defaultMealType: string;
}

export interface Contact {
  pubkey: string;
  name?: string;
  nip05?: string;
  picture?: string;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface AuthState {
  privateKey?: string;
  publicKey?: string;
  isAuthenticated: boolean;
  biometricLocked: boolean;
  lastBiometricAuth: number;
}

export interface RelayState {
  relays: string[];
  connectedRelays: Set<string>;
  defaultRelays: string[];
}

export type MealType = 'lunch' | 'dinner' | 'breakfast' | 'coffee' | 'drinks' | 'other';

export type SplitMode = 'equal' | 'custom';

export type PaymentFlow = 'split' | 'i-pay-all' | 'they-pay-all';