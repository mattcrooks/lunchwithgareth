import React from 'react';
import { Receipt, Zap, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const features = [
    {
      icon: Receipt,
      title: 'Scan Receipts',
      description: 'Quickly capture and process your dining receipts'
    },
    {
      icon: Users,
      title: 'Split Bills',
      description: 'Divide costs fairly among your dining companions'
    },
    {
      icon: Zap,
      title: 'Instant Payments',
      description: 'Request payments via Nostr zaps seamlessly'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your keys, your data, stored locally on device'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-primary-foreground/20 rounded-full flex items-center justify-center mb-6">
            <Receipt className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Lunch with Gareth
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-sm">
            The simplest way to split bills and request payments via Nostr
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-primary-foreground/10 border-primary-foreground/20">
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
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full text-primary-foreground hover:bg-primary-foreground/10"
          >
            Import Existing Key
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-primary-foreground/70">
          Powered by Nostr • Your keys, your control
        </p>
      </div>
    </div>
  );
};