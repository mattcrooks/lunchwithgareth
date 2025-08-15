// Main application orchestrator with enhanced workflow
// Integrates all MUST-have features into a complete user experience

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { WelcomeScreen } from "@/components/features/WelcomeScreen";
import { AppShell } from "@/components/layout/AppShell";
import { ScanReceiptEnhanced } from "@/components/features/ScanReceiptEnhanced";
import { SplitBillEnhanced } from "@/components/features/SplitBillEnhanced";
import { PaymentHistoryEnhanced } from "@/components/features/PaymentHistoryEnhanced";
import { Settings } from "@/components/features/Settings";
import { AuthSetup } from "@/components/features/AuthSetup";
import { BiometricGate } from "@/components/features/BiometricGate";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/auth";
import { FxRate } from "@/lib/fx";

type MainView = "welcome" | "scan" | "split" | "history" | "settings";
type Tab = "scan" | "history" | "settings";

interface ReceiptData {
  imageBlob: Blob | null;
  totalFiat: number;
  currency: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Other";
  datetime: Date;
  fxRate: FxRate;
  totalSats: number;
  rhash: string;
}

export const IndexEnhanced = () => {
  const [currentView, setCurrentView] = useState<MainView>("welcome");
  const [currentTab, setCurrentTab] = useState<Tab>("scan");
  const [showBiometricGate, setShowBiometricGate] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [completionResult, setCompletionResult] = useState<{
    success: boolean;
    receiptId?: string;
    eventId?: string;
    error?: string;
  } | null>(null);

  const {
    currentUser,
    isAuthenticated,
    needsBiometricAuth,
    servicesInitialized,
    initializeServices,
  } = useAuthStore();

  // Monitor authentication state changes to hide biometric gate
  useEffect(() => {
    // Hide biometric gate when authentication is no longer needed
    if (showBiometricGate && (!isAuthenticated || !needsBiometricAuth())) {
      setShowBiometricGate(false);
    }
  }, [showBiometricGate, isAuthenticated, needsBiometricAuth]);

  // Initialize services when user is authenticated
  useEffect(() => {
    const init = async () => {
      if (currentUser && isAuthenticated && !servicesInitialized) {
        try {
          await initializeServices();
        } catch (error) {
          console.error("Failed to initialize services:", error);
        }
      }
    };

    init();
  }, [currentUser, isAuthenticated, servicesInitialized, initializeServices]);

  // Show auth setup if no user
  if (!currentUser) {
    return <AuthSetup onComplete={() => setCurrentView("welcome")} />;
  }

  // Show biometric gate if authentication required
  const shouldShowBiometricGate =
    showBiometricGate ||
    (isAuthenticated && !showBiometricGate && needsBiometricAuth());

  if (shouldShowBiometricGate) {
    return (
      <BiometricGate
        onAuthenticated={() => {
          setShowBiometricGate(false);
        }}
        title="Authenticate to Continue"
        description="Authentication required for secure operations"
      />
    );
  }

  // Show welcome screen for first-time users or when explicitly requested
  if (currentView === "welcome") {
    return <WelcomeScreen onComplete={() => setCurrentView("scan")} />;
  }

  // Handle completion result display
  if (completionResult) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {completionResult.success ? "Request Created!" : "Request Failed"}
          </h1>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            {completionResult.success ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  Payment Request Published
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your bill split request has been published to Nostr and stored
                  locally.
                </p>
                {completionResult.eventId && (
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-xs text-muted-foreground">Event ID:</p>
                    <p className="font-mono text-sm break-all">
                      {completionResult.eventId}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Request Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {completionResult.error || "An unknown error occurred"}
                </p>
                {completionResult.receiptId && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      The request has been saved locally and can be retried
                      later.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setCompletionResult(null);
              setReceiptData(null);
              setCurrentView("scan");
              setCurrentTab("scan");
            }}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Create Another
          </Button>
          <Button
            variant="gradient"
            onClick={() => {
              setCompletionResult(null);
              setReceiptData(null);
              setCurrentView("history");
              setCurrentTab("history");
            }}
            className="flex-1"
          >
            View History
          </Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case "scan":
        if (currentView === "split" && receiptData) {
          return (
            <SplitBillEnhanced
              receiptData={receiptData}
              onComplete={(result) => {
                setCompletionResult(result);
                setReceiptData(null);
              }}
              onBack={() => setCurrentView("scan")}
            />
          );
        }
        return (
          <ScanReceiptEnhanced
            onContinue={(data) => {
              setReceiptData(data);
              setCurrentView("split");
            }}
          />
        );
      case "history":
        return <PaymentHistoryEnhanced />;
      case "settings":
        return <Settings />;
      default:
        return <ScanReceiptEnhanced onContinue={() => {}} />;
    }
  };

  return (
    <AppShell
      currentTab={currentTab}
      onTabChange={(tab) => {
        setCurrentTab(tab);
        setCurrentView(tab);
        // Clear any in-progress data when switching tabs
        if (tab !== "scan") {
          setReceiptData(null);
        }
      }}
    >
      {!servicesInitialized && (
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Initializing services... Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      {renderContent()}
    </AppShell>
  );
};
