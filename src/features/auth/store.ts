import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../../types/models';
import { storageService } from '../../lib/storage';
import { encryptPrivateKey, decryptPrivateKey } from '../../lib/crypto';
import { verifyUser } from '../../lib/webauthn';

interface AuthStore extends AuthState {
  setKeys: (privateKey: Uint8Array, publicKey: string) => Promise<void>;
  clearKeys: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  lock: () => void;
  isExpired: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      privateKey: undefined,
      publicKey: undefined,
      isAuthenticated: false,
      biometricLocked: true,
      lastBiometricAuth: 0,

      setKeys: async (privateKey: Uint8Array, publicKey: string) => {
        try {
          // Encrypt private key with a simple password (in real app, use stronger method)
          const password = 'lunch-with-gareth-' + publicKey.slice(0, 8);
          const encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
          
          await storageService.saveKeys(encryptedPrivateKey, publicKey);
          
          set({
            publicKey,
            isAuthenticated: true,
            biometricLocked: false,
            lastBiometricAuth: Date.now()
          });
        } catch (error) {
          console.error('Failed to save keys:', error);
          throw error;
        }
      },

      clearKeys: async () => {
        await storageService.clearKeys();
        set({
          privateKey: undefined,
          publicKey: undefined,
          isAuthenticated: false,
          biometricLocked: true,
          lastBiometricAuth: 0
        });
      },

      authenticate: async () => {
        try {
          const authenticated = await verifyUser();
          if (!authenticated) return false;

          const keys = await storageService.getKeys();
          if (!keys) return false;

          // Decrypt private key
          const password = 'lunch-with-gareth-' + keys.publicKey.slice(0, 8);
          const privateKey = await decryptPrivateKey(keys.encryptedPrivateKey, password);
          
          set({
            privateKey: Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
            publicKey: keys.publicKey,
            isAuthenticated: true,
            biometricLocked: false,
            lastBiometricAuth: Date.now()
          });

          return true;
        } catch (error) {
          console.error('Authentication failed:', error);
          return false;
        }
      },

      lock: () => {
        set({
          privateKey: undefined,
          biometricLocked: true,
          lastBiometricAuth: 0
        });
      },

      isExpired: () => {
        const { lastBiometricAuth } = get();
        const FIVE_MINUTES = 5 * 60 * 1000;
        return Date.now() - lastBiometricAuth > FIVE_MINUTES;
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        publicKey: state.publicKey,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);