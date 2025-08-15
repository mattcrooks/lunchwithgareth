import React from 'react';
import { Camera, History, Settings, Receipt, Users } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';

interface AppShellProps {
  children: React.ReactNode;
  currentTab?: 'scan' | 'history' | 'settings';
  onTabChange?: (tab: 'scan' | 'history' | 'settings') => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentTab = 'scan', onTabChange }) => {
  const navItems = [
    { id: 'scan', icon: Camera, label: 'Scan' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border px-4 py-2 safe-area-pb">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "gradient" : "ghost"}
                size="sm"
                className="flex flex-col items-center gap-1 py-2 px-3 h-auto min-w-[60px]"
                onClick={() => onTabChange?.(item.id)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};