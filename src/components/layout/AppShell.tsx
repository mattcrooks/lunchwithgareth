import React from "react";
import { Camera, History, Settings, Receipt, Users } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";

interface AppShellProps {
  children: React.ReactNode;
  currentTab?: "scan" | "history" | "settings";
  onTabChange?: (tab: "scan" | "history" | "settings") => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentTab = "scan",
  onTabChange,
}) => {
  const navItems = [
    { id: "scan", icon: Camera, label: "Scan" },
    { id: "history", icon: History, label: "History" },
    { id: "settings", icon: Settings, label: "Settings" },
  ] as const;

  return (
    <div className="keyboard-safe bg-background flex flex-col overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth-touch pb-20 keyboard-aware">
        {children}
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 py-2 safe-area-pb z-50 transition-all duration-300">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "gradient" : "ghost"}
                size="sm"
                className="flex flex-col items-center gap-1 py-2 px-3 h-auto min-w-[60px] transition-all duration-200 active:scale-95"
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
