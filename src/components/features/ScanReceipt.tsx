import React, { useState } from 'react';
import { Camera, Upload, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ScanReceipt: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
                onClick={() => setImagePreview(null)}
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
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="date">Date & Time</Label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        variant="gradient" 
        size="lg" 
        className="w-full"
        disabled={!imagePreview || !total}
      >
        Continue to Split Bill
      </Button>
    </div>
  );
};