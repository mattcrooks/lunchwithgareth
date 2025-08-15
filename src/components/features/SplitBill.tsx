import React, { useState } from 'react';
import { Users, Plus, Minus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  name: string;
  pubkey: string;
  share: number;
  customAmount?: number;
}

export const SplitBill: React.FC = () => {
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [paymentFlow, setPaymentFlow] = useState<'split' | 'i-pay-all' | 'they-pay-all'>('split');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Alice', pubkey: 'npub1...', share: 50 },
    { id: '2', name: 'Bob', pubkey: 'npub2...', share: 50 },
  ]);
  
  const totalAmount = 45.50;
  const totalSats = 1250; // Converted from fiat

  const addParticipant = () => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: `Person ${participants.length + 1}`,
      pubkey: 'npub...',
      share: 100 / (participants.length + 1)
    };
    setParticipants([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const updateShare = (id: string, share: number) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, share } : p
    ));
  };

  const calculateSats = (share: number) => {
    return Math.floor((totalSats * share) / 100);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Split the Bill</h1>
        <div className="text-muted-foreground">
          <p>${totalAmount.toFixed(2)} → {totalSats.toLocaleString()} sats</p>
          <p className="text-xs">Rate: 1 USD = 27,778 sats</p>
        </div>
      </div>

      {/* Payment Flow */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payment Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'split', label: 'Everyone pays their share', icon: Users },
              { id: 'i-pay-all', label: 'I pay everything', icon: Zap },
              { id: 'they-pay-all', label: 'Others pay everything', icon: Users },
            ].map((flow) => {
              const Icon = flow.icon;
              return (
                <Button
                  key={flow.id}
                  variant={paymentFlow === flow.id ? "gradient" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => setPaymentFlow(flow.id as any)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="text-sm">{flow.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Split Mode */}
      {paymentFlow === 'split' && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Split Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant={splitMode === 'equal' ? "gradient" : "outline"}
                onClick={() => setSplitMode('equal')}
                className="flex-1"
              >
                Equal Split
              </Button>
              <Button
                variant={splitMode === 'custom' ? "gradient" : "outline"}
                onClick={() => setSplitMode('custom')}
                className="flex-1"
              >
                Custom Split
              </Button>
            </div>

            {/* Participants */}
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 bg-card-subtle rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {participant.pubkey}
                    </div>
                  </div>
                  
                  {splitMode === 'equal' ? (
                    <Badge variant="secondary">
                      {calculateSats(100 / participants.length).toLocaleString()} sats
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={participant.share}
                        onChange={(e) => updateShare(participant.id, Number(e.target.value))}
                        className="w-16 h-8 text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-xs">%</span>
                      <Badge variant="secondary">
                        {calculateSats(participant.share).toLocaleString()} sats
                      </Badge>
                    </div>
                  )}
                  
                  {participants.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParticipant(participant.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addParticipant}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Request Button */}
      <Button 
        variant="gradient" 
        size="lg" 
        className="w-full"
      >
        <Zap className="w-4 h-4 mr-2" />
        Create Payment Request
      </Button>
    </div>
  );
};