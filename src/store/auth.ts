import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NostrProfile, StoredKey } from "@/types/models";
import { NostrClient } from "@/lib/nostr";
import { CryptoManager } from "@/lib/crypto";
import { BiometricAuth } from "@/lib/webauthn";
import { billSplitService } from "@/lib/billSplit";
import { utils } from "nostr-tools";

interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  currentUser: NostrProfile | null;
  storedKeys: StoredKey[];
  lastBiometricAuth: number;
  servicesInitialized: boolean;

  // Actions
  generateNewKey: () => Promise<{ privateKey: string; publicKey: string }>;
  importKey: (privateKey: string, devicePassword: string) => Promise<void>;
  authenticate: (devicePassword: string) => Promise<boolean>;
  authenticateWithBiometric: () => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<NostrProfile>) => void;
  needsBiometricAuth: () => boolean;
  initializeServices: () => Promise<void>;

  // Key management
  getDecryptedPrivateKey: (
    devicePassword: string
  ) => Promise<Uint8Array | null>;
  deleteStoredKey: (pubkey: string) => void;
}

const BIOMETRIC_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      storedKeys: [],
      lastBiometricAuth: 0,
      servicesInitialized: false,

      generateNewKey: async () => {
        const keyPair = NostrClient.generateKeyPair();
        return {
          privateKey: keyPair.privateKey,
          publicKey: keyPair.publicKey,
        };
      },

      importKey: async (privateKey: string, devicePassword: string) => {
        try {
          const decoded = NostrClient.decodeKey(privateKey);
          if (!decoded.privateKey) {
            throw new Error("Invalid private key");
          }

          const pubkey = decoded.publicKey;

          // Convert Uint8Array to hex string for encryption
          const privateKeyHex = utils.bytesToHex(decoded.privateKey);

          const encryptedPrivateKey = await CryptoManager.encryptData(
            privateKeyHex,
            devicePassword
          );

          const storedKey: StoredKey = {
            pubkey,
            encryptedPrivateKey,
            createdAt: Date.now(),
            lastUsed: Date.now(),
          };

          const profile: NostrProfile = {
            pubkey,
          };

          set((state) => ({
            storedKeys: [
              ...state.storedKeys.filter((k) => k.pubkey !== pubkey),
              storedKey,
            ],
            currentUser: profile,
            isAuthenticated: true,
          }));
        } catch (error) {
          console.error("Failed to import key:", error);
          throw new Error("Failed to import key: " + (error as Error).message);
        }
      },

      authenticate: async (devicePassword: string) => {
        const { storedKeys, currentUser } = get();

        if (!currentUser || storedKeys.length === 0) {
          return false;
        }

        try {
          const currentKey = storedKeys.find(
            (k) => k.pubkey === currentUser.pubkey
          );
          if (!currentKey) {
            return false;
          }

          // Try to decrypt to verify password
          await CryptoManager.decryptData(
            currentKey.encryptedPrivateKey,
            devicePassword
          );

          set({
            isAuthenticated: true,
            lastBiometricAuth: Date.now(), // Update biometric auth timestamp for both auth methods
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      authenticateWithBiometric: async () => {
        try {
          const success = await BiometricAuth.authenticate();
          if (success) {
            set({
              isAuthenticated: true,
              lastBiometricAuth: Date.now(),
            });
          }
          return success;
        } catch (error) {
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          lastBiometricAuth: 0,
        });
      },

      updateProfile: (profile: Partial<NostrProfile>) => {
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...profile }
            : null,
        }));
      },

      needsBiometricAuth: () => {
        const { lastBiometricAuth } = get();
        return Date.now() - lastBiometricAuth > BIOMETRIC_TIMEOUT;
      },

      getDecryptedPrivateKey: async (devicePassword: string) => {
        const { currentUser, storedKeys } = get();

        if (!currentUser) {
          return null;
        }

        const currentKey = storedKeys.find(
          (k) => k.pubkey === currentUser.pubkey
        );
        if (!currentKey) {
          return null;
        }

        try {
          const decryptedKey = await CryptoManager.decryptData(
            currentKey.encryptedPrivateKey,
            devicePassword
          );

          const decoded = NostrClient.decodeKey(decryptedKey);
          return decoded.privateKey || null;
        } catch (error) {
          return null;
        }
      },

      initializeServices: async () => {
        const { currentUser } = get();
        try {
          await billSplitService.initialize(currentUser?.pubkey);
          set({ servicesInitialized: true });
        } catch (error) {
          console.error("Failed to initialize services:", error);
          throw error;
        }
      },

      deleteStoredKey: (pubkey: string) => {
        set((state) => ({
          storedKeys: state.storedKeys.filter((k) => k.pubkey !== pubkey),
          currentUser:
            state.currentUser?.pubkey === pubkey ? null : state.currentUser,
          isAuthenticated:
            state.currentUser?.pubkey === pubkey
              ? false
              : state.isAuthenticated,
        }));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        storedKeys: state.storedKeys,
      }),
    }
  )
);
