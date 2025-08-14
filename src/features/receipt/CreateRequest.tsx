import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { ReceiptCapture } from './ReceiptCapture';
import { SplitConfig } from '../split/SplitConfig';
import { ContactSelector } from '../contacts/ContactSelector';
import { useReceiptStore } from './store';
import { useFXStore } from '../split/fxStore';
import { fetchFXRate, convertToSats } from '../../lib/fx';
import { generateId } from '../../lib/ids';
import type { Receipt, Participant, PaymentFlow, MealType } from '../../types/models';

const MEAL_TYPES: MealType[] = ['lunch', 'dinner', 'breakfast', 'coffee', 'drinks', 'other'];

export function CreateRequest() {
  const [step, setStep] = useState<'receipt' | 'details' | 'split' | 'contacts' | 'confirm'>('receipt');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('split');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addReceipt } = useReceiptStore();
  const { fxRate, setFXRate } = useFXStore();

  const handleReceiptCaptured = (imageDataUrl: string) => {
    setReceiptImage(imageDataUrl);
    setStep('details');
  };

  const handleDetailsSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const rate = await fetchFXRate(currency);
      setFXRate(rate);
      setStep('split');
    } catch (err) {
      setError('Failed to fetch exchange rate');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitConfigured = (newParticipants: Participant[], flow: PaymentFlow) => {
    setParticipants(newParticipants);
    setPaymentFlow(flow);
    setStep('contacts');
  };

  const handleContactsSelected = (selectedContacts: string[]) => {
    const updatedParticipants = participants.map((p, index) => ({
      ...p,
      pubkey: selectedContacts[index] || p.pubkey
    }));
    setParticipants(updatedParticipants);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError('');

      if (!fxRate) {
        throw new Error('Exchange rate not available');
      }

      const receipt: Receipt = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        imageUri: receiptImage,
        amountFiat: Number(amount),
        currency,
        amountSats: convertToSats(Number(amount), fxRate.rate),
        fxRate: fxRate.rate,
        fxSource: fxRate.source,
        fxTimestamp: fxRate.timestamp,
        mealType,
        participants,
        splitJson: JSON.stringify({ flow: paymentFlow, participants }),
        flow: paymentFlow
      };

      await addReceipt(receipt);
      
      // Reset form
      setStep('receipt');
      setReceiptImage('');
      setAmount('');
      setParticipants([]);
      
      alert('Request created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'details':
        setStep('receipt');
        break;
      case 'split':
        setStep('details');
        break;
      case 'contacts':
        setStep('split');
        break;
      case 'confirm':
        setStep('contacts');
        break;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Payment Request</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={step === 'receipt' ? 'text-primary font-medium' : ''}>
              Receipt
            </span>
            <span>→</span>
            <span className={step === 'details' ? 'text-primary font-medium' : ''}>
              Details
            </span>
            <span>→</span>
            <span className={step === 'split' ? 'text-primary font-medium' : ''}>
              Split
            </span>
            <span>→</span>
            <span className={step === 'contacts' ? 'text-primary font-medium' : ''}>
              Contacts
            </span>
            <span>→</span>
            <span className={step === 'confirm' ? 'text-primary font-medium' : ''}>
              Confirm
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {step === 'receipt' && (
            <ReceiptCapture onImageCaptured={handleReceiptCaptured} />
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <select
                  className="w-full p-2 border rounded"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="HKD">HKD</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Meal Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                >
                  {MEAL_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 'split' && (
            <SplitConfig
              totalAmount={Number(amount)}
              currency={currency}
              fxRate={fxRate?.rate || 0}
              onConfigured={handleSplitConfigured}
            />
          )}

          {step === 'contacts' && (
            <ContactSelector
              participantCount={participants.length}
              onContactsSelected={handleContactsSelected}
            />
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <h3 className="font-medium">Confirm Request</h3>
              <div className="space-y-2 text-sm">
                <div>Amount: {amount} {currency}</div>
                <div>Sats: {fxRate ? convertToSats(Number(amount), fxRate.rate) : 'N/A'}</div>
                <div>Meal Type: {mealType}</div>
                <div>Payment Flow: {paymentFlow}</div>
                <div>Participants: {participants.length}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {step !== 'receipt' && (
            <Button variant="outline" onClick={goBack} disabled={loading}>
              Back
            </Button>
          )}
          
          {step === 'details' && (
            <Button onClick={handleDetailsSubmit} disabled={loading || !amount}>
              {loading ? 'Loading...' : 'Continue'}
            </Button>
          )}
          
          {step === 'confirm' && (
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}