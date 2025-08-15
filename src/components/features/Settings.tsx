import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { BiometricAuth } from '@/lib/webauthn';
import { 
  User, 
  Key, 
  Smartphone, 
  Moon, 
  Sun, 
  Trash2, 
  Copy,
  Settings as SettingsIcon,
  Shield,
  Palette
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { currentUser, updateProfile, logout, deleteStoredKey } = useAuthStore();
  const { toast } = useToast();
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [biometricEnabled, setBiometricEnabled] = useState(BiometricAuth.hasBiometricCredential());
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultMealType, setDefaultMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Other'>('Lunch');

  const handleCopyPubkey = () => {
    if (currentUser?.pubkey) {
      navigator.clipboard.writeText(currentUser.pubkey);
      toast({
        title: 'Copied',
        description: 'Public key copied to clipboard'
      });
    }
  };

  const handleToggleBiometric = async () => {
    if (biometricEnabled) {
      BiometricAuth.removeBiometricCredential();
      setBiometricEnabled(false);
      toast({
        title: 'Disabled',
        description: 'Biometric authentication disabled'
      });
    } else {
      const success = await BiometricAuth.createCredential();
      if (success) {
        setBiometricEnabled(true);
        toast({
          title: 'Enabled',
          description: 'Biometric authentication enabled'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to setup biometric authentication',
          variant: 'destructive'
        });
      }
    }
  };

  const handleDeleteAccount = () => {
    if (currentUser?.pubkey && confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      deleteStoredKey(currentUser.pubkey);
      toast({
        title: 'Account Deleted',
        description: 'Your account has been removed from this device'
      });
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your Nostr identity and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Public Key</Label>
            <div className="flex gap-2">
              <Input 
                value={currentUser?.pubkey?.slice(0, 16) + '...' || 'Not set'} 
                readOnly 
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleCopyPubkey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your display name"
              value={currentUser?.displayName || ''}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nip05">NIP-05 Identifier</Label>
            <Input
              id="nip05"
              placeholder="name@domain.com"
              value={currentUser?.nip05 || ''}
              onChange={(e) => updateProfile({ nip05: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your authentication and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">Biometric Authentication</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use fingerprint or face unlock
              </p>
            </div>
            <div className="flex items-center gap-2">
              {biometricEnabled && (
                <Badge variant="secondary" className="text-xs">
                  Enabled
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleToggleBiometric}
              >
                {biometricEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="text-sm font-medium">Private Key</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Encrypted and stored on device only
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Secure
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="HKD">HKD - Hong Kong Dollar</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Meal Type</Label>
            <Select value={defaultMealType} onValueChange={(value: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other') => setDefaultMealType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium">Delete Account</span>
              <p className="text-xs text-muted-foreground">
                Remove your key from this device permanently
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-medium">Sign Out</span>
              <p className="text-xs text-muted-foreground">
                Sign out of your current session
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};