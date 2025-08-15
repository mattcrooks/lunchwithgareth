import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { BiometricAuth } from '@/lib/webauthn';
import { Key, Smartphone, Eye, EyeOff } from 'lucide-react';

interface AuthSetupProps {
  onComplete: () => void;
}

export const AuthSetup: React.FC<AuthSetupProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'generate' | 'import'>('generate');
  const [privateKey, setPrivateKey] = useState('');
  const [devicePassword, setDevicePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  const { generateNewKey, importKey } = useAuthStore();
  const { toast } = useToast();

  React.useEffect(() => {
    BiometricAuth.isSupported().then(setBiometricSupported);
  }, []);

  const handleGenerate = async () => {
    if (!devicePassword || devicePassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const keyPair = await generateNewKey();
      await importKey(keyPair.privateKey, devicePassword);
      
      if (enableBiometric && biometricSupported) {
        await BiometricAuth.createCredential();
      }

      toast({
        title: 'Success',
        description: 'New Nostr key generated and secured'
      });
      onComplete();
    } catch (error) {
      toast({
        title: 'Error ',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!privateKey || !devicePassword || devicePassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and ensure passwords match',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await importKey(privateKey, devicePassword);
      
      if (enableBiometric && biometricSupported) {
        await BiometricAuth.createCredential();
      }

      toast({
        title: 'Success',
        description: 'Nostr key imported successfully'
      });
      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <Key className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Setup Your Nostr Identity</h1>
          <p className="text-muted-foreground">
            Secure your private key with device encryption
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex space-x-2">
              <Button
                variant={mode === 'generate' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('generate')}
                className="flex-1"
              >
                Generate New
              </Button>
              <Button
                variant={mode === 'import' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('import')}
                className="flex-1"
              >
                Import Existing
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'import' && (
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key (nsec...)</Label>
                <div className="relative">
                  <Textarea
                    id="privateKey"
                    placeholder="nsec1..."
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="devicePassword">Device Password</Label>
              <div className="relative">
                <Input
                  id="devicePassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a secure password"
                  value={devicePassword}
                  onChange={(e) => setDevicePassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full w-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {biometricSupported && (
              <>
                <Separator />
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="biometric" className="text-sm font-medium">
                      Enable Biometric Authentication
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use fingerprint or face unlock for quick access
                    </p>
                  </div>
                  <input
                    id="biometric"
                    type="checkbox"
                    checked={enableBiometric}
                    onChange={(e) => setEnableBiometric(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </>
            )}

            <Button
              onClick={mode === 'generate' ? handleGenerate : handleImport}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : mode === 'generate' ? 'Generate Key' : 'Import Key'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};