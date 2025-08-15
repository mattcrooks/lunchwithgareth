export class BiometricAuth {
  static async isSupported(): Promise<boolean> {
    return 'credentials' in navigator && 'create' in navigator.credentials;
  }

  static async createCredential(): Promise<boolean> {
    try {
      if (!await this.isSupported()) {
        throw new Error('WebAuthn not supported');
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            name: 'Nostr Bill Split',
            id: window.location.hostname,
          },
          user: {
            id: crypto.getRandomValues(new Uint8Array(64)),
            name: 'user@nostrbillsplit.app',
            displayName: 'Nostr User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        // Store credential ID for later use
        localStorage.setItem('webauthn_credential_id', credential.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create biometric credential:', error);
      return false;
    }
  }

  static async authenticate(): Promise<boolean> {
    try {
      if (!await this.isSupported()) {
        throw new Error('WebAuthn not supported');
      }

      const credentialId = localStorage.getItem('webauthn_credential_id');
      if (!credentialId) {
        throw new Error('No biometric credential found');
      }

      // Convert credential ID from base64
      const credentialIdBytes = Uint8Array.from(
        atob(credentialId), c => c.charCodeAt(0)
      );

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{
            id: credentialIdBytes,
            type: 'public-key',
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      return !!assertion;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  static hasBiometricCredential(): boolean {
    return !!localStorage.getItem('webauthn_credential_id');
  }

  static removeBiometricCredential(): void {
    localStorage.removeItem('webauthn_credential_id');
  }
}