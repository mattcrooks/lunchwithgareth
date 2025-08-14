import { useState } from 'react';
import { Button } from '../components/ui/button';
import { CreateRequest } from '../features/receipt/CreateRequest';
import { History } from '../features/history/History';
import { Settings } from '../features/settings/Settings';
import { useAuthStore } from '../features/auth/store';

type Tab = 'create' | 'history' | 'settings';

export function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const { publicKey, clearKeys } = useAuthStore();

  const handleLogout = async () => {
    await clearKeys();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Lunch with Gareth</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {publicKey?.slice(0, 8)}...
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex">
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              className="rounded-none border-none"
              onClick={() => setActiveTab('create')}
            >
              Create Request
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              className="rounded-none border-none"
              onClick={() => setActiveTab('history')}
            >
              History
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className="rounded-none border-none"
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'create' && <CreateRequest />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}