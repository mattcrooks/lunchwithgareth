import React, { useState } from "react";
import { WelcomeScreen } from "@/components/features/WelcomeScreen";
import { AppShell } from "@/components/layout/AppShell";
import { ScanReceipt } from "@/components/features/ScanReceipt";
import { SplitBill } from "@/components/features/SplitBill";
import { PaymentHistory } from "@/components/features/PaymentHistory";
import { Settings } from "@/components/features/Settings";
import { AuthSetup } from "@/components/features/AuthSetup";
import { BiometricGate } from "@/components/features/BiometricGate";
import { useAuthStore } from "@/store/auth";

const Index = () => {
  const [currentView, setCurrentView] = useState<
    "welcome" | "scan" | "split" | "history" | "settings"
  >("scan");
  const [currentTab, setCurrentTab] = useState<"scan" | "history" | "settings">(
    "scan"
  );
  const [showBiometricGate, setShowBiometricGate] = useState(false);

  const { currentUser, isAuthenticated, needsBiometricAuth } = useAuthStore();

  // Show auth setup if no user
  if (!currentUser) {
    return <AuthSetup onComplete={() => {}} />;
  }

  // Show biometric gate if authentication required
  if (showBiometricGate || (isAuthenticated && needsBiometricAuth())) {
    return (
      <BiometricGate
        onAuthenticated={() => setShowBiometricGate(false)}
        title="Authenticate to Continue"
        description="Authentication required for secure operations"
      />
    );
  }

  // Show welcome screen for first-time users
  if (currentView === "welcome") {
    return <WelcomeScreen onComplete={() => setCurrentView("scan")} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case "scan":
        if (currentView === "split") {
          return <SplitBill />;
        }
        return <ScanReceipt />;
      case "history":
        return <PaymentHistory />;
      case "settings":
        return <Settings />;
      default:
        return <ScanReceipt />;
    }
  };

  return (
    <AppShell currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </AppShell>
  );
};

export default Index;
