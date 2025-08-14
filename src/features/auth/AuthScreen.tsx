import { useState } from 'react';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { useAuthStore } from './store';
import { isValidNsec } from '../../lib/ids';

export function AuthScreen() {
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [importKey, setImportKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setKeys } = useAuthStore();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const privateKey = generateSecretKey();
      const publicKey = getPublicKey(privateKey);
      
      await setKeys(privateKey, publicKey);
    } catch (err) {
      setError('Failed to generate keys');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!isValidNsec(importKey)) {
        throw new Error('Invalid private key format');
      }

      const { data: privateKey } = nip19.decode(importKey);
      const publicKey = getPublicKey(privateKey as Uint8Array);
      
      await setKeys(privateKey as Uint8Array, publicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Lunch with Gareth</CardTitle>
          <p className="text-muted-foreground">
            {mode === 'generate' 
              ? 'Generate a new Nostr key pair' 
              : 'Import your existing Nostr key'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex rounded-lg border p-1">
            <Button
              variant={mode === 'generate' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setMode('generate')}
            >
              Generate
            </Button>
            <Button
              variant={mode === 'import' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setMode('import')}
            >
              Import
            </Button>
          </div>

          {mode === 'import' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Private Key (nsec)</label>
              <Input
                type="password"
                placeholder="nsec1..."
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={mode === 'generate' ? handleGenerate : handleImport}
            disabled={loading || (mode === 'import' && !importKey)}
          >
            {loading ? 'Setting up...' : mode === 'generate' ? 'Generate Keys' : 'Import Key'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}