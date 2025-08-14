import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { useSettingsStore } from './store';
import { useAuthStore } from '../auth/store';
import { nip19 } from 'nostr-tools';

export function Settings() {
  const [relayInput, setRelayInput] = useState('');
  const [defaultMealType, setDefaultMealType] = useState('lunch');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { publicKey, clearKeys } = useAuthStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setDefaultMealType(settings.defaultMealType);
      setTheme(settings.theme);
    }
  }, [settings]);

  const handleAddRelay = async () => {
    if (!relayInput.trim()) return;
    
    const newRelays = [...(settings?.relays || []), relayInput.trim()];
    await updateSettings({ relays: newRelays });
    setRelayInput('');
  };

  const handleRemoveRelay = async (relay: string) => {
    const newRelays = (settings?.relays || []).filter(r => r !== relay);
    await updateSettings({ relays: newRelays });
  };

  const handleSaveSettings = async () => {
    await updateSettings({
      defaultMealType,
      theme,
      biometricEnabled: true // Always enabled for now
    });
    alert('Settings saved!');
  };

  const handleExportKey = () => {
    if (publicKey) {
      const npub = nip19.npubEncode(publicKey);
      navigator.clipboard.writeText(npub);
      alert('Public key copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout? This will clear your keys from this device.')) {
      await clearKeys();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Public Key</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={publicKey || ''}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" onClick={handleExportKey}>
                Copy npub
              </Button>
            </div>
          </div>
          
          <Button variant="destructive" onClick={handleLogout}>
            Logout & Clear Keys
          </Button>
        </CardContent>
      </Card>

      {/* Relays */}
      <Card>
        <CardHeader>
          <CardTitle>Nostr Relays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="wss://relay.example.com"
              value={relayInput}
              onChange={(e) => setRelayInput(e.target.value)}
            />
            <Button onClick={handleAddRelay}>Add</Button>
          </div>
          
          <div className="space-y-2">
            {(settings?.relays || []).map((relay, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-mono">{relay}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRelay(relay)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          
          {(!settings?.relays || settings.relays.length === 0) && (
            <div className="text-sm text-muted-foreground">
              No custom relays configured. Using default relays.
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Default Meal Type</label>
            <select
              className="w-full p-2 border rounded mt-1"
              value={defaultMealType}
              onChange={(e) => setDefaultMealType(e.target.value)}
            >
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="breakfast">Breakfast</option>
              <option value="coffee">Coffee</option>
              <option value="drinks">Drinks</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Theme</label>
            <select
              className="w-full p-2 border rounded mt-1"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="biometric"
              checked={true}
              disabled
            />
            <label htmlFor="biometric" className="text-sm">
              Biometric Authentication (Always enabled)
            </label>
          </div>

          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div>
              <strong>Lunch with Gareth</strong> v0.1.0
            </div>
            <div>
              A mobile-first PWA for splitting bills via Nostr and Bitcoin.
            </div>
            <div>
              Licensed under Mozilla Public License 2.0
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}