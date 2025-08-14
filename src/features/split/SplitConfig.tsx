import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { convertToSats, formatSats, formatCurrency } from '../../lib/fx';
import { splitEqual, splitCustom } from '../../lib/rounding';
import type { Participant, PaymentFlow } from '../../types/models';

interface SplitConfigProps {
  totalAmount: number;
  currency: string;
  fxRate: number;
  onConfigured: (participants: Participant[], flow: PaymentFlow) => void;
}

export function SplitConfig({ totalAmount, currency, fxRate, onConfigured }: SplitConfigProps) {
  const [participantCount, setParticipantCount] = useState(2);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('split');
  const [customShares, setCustomShares] = useState<number[]>([1, 1]);

  const totalSats = convertToSats(totalAmount, fxRate);

  useEffect(() => {
    setCustomShares(new Array(participantCount).fill(1));
  }, [participantCount]);

  const generateParticipants = (): Participant[] => {
    const baseParticipants: Participant[] = Array.from({ length: participantCount }, () => ({
      pubkey: '', // Will be filled in later
      shareSats: 0,
      paidSats: 0,
      status: 'pending' as const
    }));

    if (paymentFlow === 'i-pay-all') {
      return baseParticipants.map((p, i) => ({
        ...p,
        shareSats: i === 0 ? totalSats : 0
      }));
    }

    if (paymentFlow === 'they-pay-all') {
      return baseParticipants.map((p, i) => ({
        ...p,
        shareSats: i === 0 ? 0 : Math.floor(totalSats / (participantCount - 1))
      }));
    }

    // Normal split
    if (splitMode === 'equal') {
      return splitEqual(totalSats, baseParticipants);
    } else {
      return splitCustom(totalSats, baseParticipants, customShares);
    }
  };

  const participants = generateParticipants();

  const handleContinue = () => {
    onConfigured(participants, paymentFlow);
  };

  const updateCustomShare = (index: number, value: number) => {
    const newShares = [...customShares];
    newShares[index] = value;
    setCustomShares(newShares);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Configure Split</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Payment Flow</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={paymentFlow === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentFlow('split')}
              >
                Split Bill
              </Button>
              <Button
                variant={paymentFlow === 'i-pay-all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentFlow('i-pay-all')}
              >
                I Pay All
              </Button>
              <Button
                variant={paymentFlow === 'they-pay-all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentFlow('they-pay-all')}
              >
                They Pay All
              </Button>
            </div>
          </div>

          {paymentFlow === 'split' && (
            <>
              <div>
                <label className="text-sm font-medium">Number of People</label>
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Math.max(2, parseInt(e.target.value) || 2))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Split Mode</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={splitMode === 'equal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSplitMode('equal')}
                  >
                    Equal Split
                  </Button>
                  <Button
                    variant={splitMode === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSplitMode('custom')}
                  >
                    Custom Split
                  </Button>
                </div>
              </div>

              {splitMode === 'custom' && (
                <div>
                  <label className="text-sm font-medium">Custom Shares</label>
                  <div className="space-y-2 mt-2">
                    {customShares.map((share, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm w-16">Person {index + 1}:</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={share}
                          onChange={(e) => updateCustomShare(index, parseFloat(e.target.value) || 0)}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {paymentFlow !== 'split' && (
            <div>
              <label className="text-sm font-medium">Number of Participants</label>
              <Input
                type="number"
                min="2"
                max="10"
                value={participantCount}
                onChange={(e) => setParticipantCount(Math.max(2, parseInt(e.target.value) || 2))}
                className="mt-1"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-muted/50">
        <h4 className="font-medium mb-2">Split Preview</h4>
        <div className="text-sm space-y-1">
          <div>Total: {formatCurrency(totalAmount, currency)} ({formatSats(totalSats)})</div>
          <div>Per person breakdown:</div>
          {participants.map((participant, index) => (
            <div key={index} className="ml-4">
              Person {index + 1}: {formatSats(participant.shareSats)}
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleContinue} 
        className="w-full"
        disabled={participantCount < 2}
      >
        Continue to Contacts
      </Button>
    </div>
  );
}