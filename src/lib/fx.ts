export interface FXRate {
  rate: number;
  source: string;
  timestamp: string;
}

export async function fetchFXRate(currency: string): Promise<FXRate> {
  try {
    // Using CoinGecko API for BTC price
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`
    );
    
    if (!response.ok) {
      throw new Error('FX API request failed');
    }

    const data = await response.json();
    const rate = data.bitcoin[currency.toLowerCase()];
    
    if (!rate) {
      throw new Error('Currency not supported');
    }

    // Convert to sats per unit
    const satsPerBTC = 100000000; // 100 million sats in 1 BTC
    const satsPerUnit = satsPerBTC / rate;

    return {
      rate: Math.floor(satsPerUnit), // Round down to whole sats
      source: 'CoinGecko',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch FX rate:', error);
    // Fallback rates (approximate, for demo purposes)
    const fallbackRates: Record<string, number> = {
      'USD': 2000, // sats per USD (example rate)
      'EUR': 2200, // sats per EUR
      'GBP': 2500, // sats per GBP
      'HKD': 250,  // sats per HKD
      'JPY': 15,   // sats per JPY
    };

    const rate = fallbackRates[currency.toUpperCase()] || 2000;
    
    return {
      rate,
      source: 'Fallback',
      timestamp: new Date().toISOString()
    };
  }
}

export function convertToSats(amount: number, fxRate: number): number {
  return Math.floor(amount * fxRate);
}

export function formatSats(sats: number): string {
  return new Intl.NumberFormat().format(sats) + ' sats';
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}