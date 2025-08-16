import React, { useState } from "react";
import { Receipt, Zap, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "../ui/app-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [showModal, setShowModal] = useState(false);

  const features = [
    {
      icon: Receipt,
      title: "Scan Receipts",
      description: "Quickly capture and process your dining receipts",
    },
    {
      icon: Users,
      title: "Split Bills",
      description: "Divide costs fairly among your dining companions",
    },
    {
      icon: Zap,
      title: "Instant Payments",
      description: "Request payments via Nostr zaps seamlessly",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your keys, your data, stored locally on device",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8" onClick={() => setShowModal(true)}>
          <AppIcon
            size="xl"
            className="mx-auto mb-4 bg-primary-foreground/20 cursor-pointer"
          />
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Lunch with Gareth
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-sm">
            The simplest way to split bills and request payments via Nostr...
            when he forgets his wallet, again.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-primary-foreground/10 border-primary-foreground/20"
              >
                <CardContent className="p-4 text-center">
                  <Icon className="w-8 h-8 text-primary-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-primary-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-primary-foreground/80">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Button
            variant="card"
            size="lg"
            className="w-full"
            onClick={onComplete}
          >
            Get Started
          </Button>
        </div>

        {/* Cheeky Tag Line */}
        <p className="text-sm text-primary-foreground/70 italic mt-6 max-w-sm mx-auto">
          Because Gareth's wallet has more excuses than the Fed's balance sheet.
        </p>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-primary-foreground/70">
          Powered by Nostr • Your keys, your control
        </p>
      </div>

      {/* Popup Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md mx-auto bg-card text-card-foreground p-8 rounded-xl shadow-2xl border-primary/20">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <AppIcon size="lg" />
            <DialogTitle className="text-2xl font-bold">
              Why Lunch with Gareth?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="text-center text-sm text-muted-foreground space-y-4 pt-4">
              <p className="italic">
                Ah, Gareth. Arse tighter than a fish. Shows up to lunch,
                “forgets” his wallet... Next time, his credit card's been
                through the wash and the chip's broken. A new story every time -
                and I'm the mug footing the bill.
              </p>
              <p>
                <strong>Enter Lunch with Gareth</strong> the world's first
                anti-freeloader app. Snap the receipt, fire off a Nostr Event,
                and watch him squirm until he zaps you back the sats.
              </p>
              <p className="font-semibold text-primary pt-2">
                Don't let him slide. Make him pay - literally.
              </p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};
