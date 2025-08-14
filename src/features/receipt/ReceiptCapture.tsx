import { useRef, useState } from 'react';
import { Button } from '../../components/ui/button';

interface ReceiptCaptureProps {
  onImageCaptured: (imageDataUrl: string) => void;
}

export function ReceiptCapture({ onImageCaptured }: ReceiptCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    if (preview) {
      onImageCaptured(preview);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-medium mb-2">Capture Receipt</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Take a photo or upload an image of your receipt
        </p>
        
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Receipt preview"
              className="max-w-full max-h-64 mx-auto rounded border"
            />
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={triggerFileInput}>
                Choose Different Image
              </Button>
              <Button onClick={handleCapture}>
                Use This Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-4">
              <div className="text-4xl">📷</div>
              <Button onClick={triggerFileInput}>
                Choose Image
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}