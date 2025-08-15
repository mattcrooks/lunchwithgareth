// Enhanced ScanReceipt component with full integration
// Implements REQ-REC-001, REQ-REC-003, REQ-CUR-001

import React, { useState, useEffect } from 'react';
import { Camera, Upload, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FxManager, FxRate } from '@/lib/fx';
import { HashManager } from '@/lib/ids';

interface ScanReceiptProps {
  onContinue: (data: {
    imageBlob: Blob;
    totalFiat: number;
    currency: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
    datetime: Date;
    fxRate: FxRate;
    totalSats: number;
    rhash: string;
  }) => void;
}

export const ScanReceiptEnhanced: React.FC<ScanReceiptProps> = ({ onContinue }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Other'>('Lunch');
  const [datetime, setDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [fxRate, setFxRate] = useState<FxRate | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch FX rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      if (!currency) return;
      
      setFxLoading(true);
      setFxError(null);
      
      try {
        const rate = await FxManager.getCurrentRate(currency);
        setFxRate(rate);
      } catch (error) {
        setFxError((error as Error).message);
        setFxRate(null);
      } finally {
        setFxLoading(false);
      }
    };

    fetchRate();
  }, [currency]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file is too large. Please select an image under 10MB.');
        return;
      }

      setImageBlob(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateSats = (fiatAmount: number, rate: FxRate): number => {
    return FxManager.convertToSats(fiatAmount, rate);
  };

  const handleContinue = async () => {
    if (!imageBlob || !total || !fxRate) {
      return;
    }

    setIsProcessing(true);
    
    try {
      const totalFiat = parseFloat(total);
      const totalSats = calculateSats(totalFiat, fxRate);
      const rhash = await HashManager.hashReceiptImage(imageBlob);
      
      onContinue({
        imageBlob,
        totalFiat,
        currency,
        mealType,
        datetime: new Date(datetime),
        fxRate,
        totalSats,
        rhash
      });
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValid = imageBlob && total && fxRate && !fxLoading && !isProcessing;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Scan Receipt</h1>
        <p className="text-muted-foreground">Capture your receipt to start splitting the bill</p>
      </div>

      {/* Image Capture */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          {!imagePreview ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Add Receipt Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Take a photo or upload an existing image
              </p>
              <div className="space-y-2">
                <Button variant="gradient" className="w-full" asChild>
                  <label htmlFor="camera-input" className="cursor-pointer">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                    <input
                      id="camera-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <label htmlFor="upload-input" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                    <input
                      id="upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={imagePreview}
                alt="Receipt preview"
                className="w-full max-h-64 object-contain rounded-lg"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setImagePreview(null);
                  setImageBlob(null);
                }}
                className="w-full"
              >
                Change Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Details */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Receipt Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label htmlFor="total">Total Amount</Label>
              <Input
                id="total"
                placeholder="0.00"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="text-lg font-semibold"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  {/* Add more currencies when supported */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={(value: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other') => setMealType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date">Date & Time</Label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </div>
          </div>

          {/* FX Rate Display */}
          {fxLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fetching current exchange rate...
              </AlertDescription>
            </Alert>
          )}

          {fxError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to fetch exchange rate: {fxError}
              </AlertDescription>
            </Alert>
          )}

          {fxRate && total && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>Exchange rate: 1 {currency} = {fxRate.rate.toLocaleString()} sats</div>
                  <div>Total: {calculateSats(parseFloat(total), fxRate).toLocaleString()} sats</div>
                  <div className="text-xs text-muted-foreground">Source: {fxRate.source}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        variant="gradient" 
        size="lg" 
        className="w-full"
        disabled={!isValid}
        onClick={handleContinue}
      >
        {isProcessing ? 'Processing...' : 'Continue to Split Bill'}
      </Button>
    </div>
  );
};
