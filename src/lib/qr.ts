import QRCode from 'qrcode';
import jsQR from 'jsqr';

export async function generateQR(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw error;
  }
}

export function scanQR(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code ? code.data : null;
  } catch (error) {
    console.error('Failed to scan QR code:', error);
    return null;
  }
}

export async function createQRFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return scanQR(imageData);
}

export function getQRDataFromVideo(video: HTMLVideoElement): string | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return scanQR(imageData);
}