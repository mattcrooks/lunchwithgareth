export async function authenticateUser(): Promise<boolean> {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn not supported');
    }

    // Simple biometric authentication
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'Lunch with Gareth',
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(64)),
          name: 'user@lunchwithgareth.app',
          displayName: 'User',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      },
    });

    return credential !== null;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

export async function verifyUser(): Promise<boolean> {
  try {
    // For demo purposes, we'll use a simple prompt
    // In a real app, this would use stored credentials
    return new Promise((resolve) => {
      if (window.confirm('Authenticate to access your keys?')) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  } catch (error) {
    console.error('User verification failed:', error);
    return false;
  }
}

export function isBiometricSupported(): boolean {
  return 'credentials' in navigator && 'PublicKeyCredential' in window;
}