// Foreign exchange rate utilities for converting fiat to sats
// REQ-CUR-001, REQ-CUR-002, REQ-CUR-003

export interface FxRate {
  currency: string;
  rate: number; // sats per unit of currency
  source: string;
  timestamp: number;
}

export interface FxSource {
  name: string;
  url: string;
  parseResponse: (data: Record<string, unknown>) => number; // returns USD price in dollars
}

// Free FX sources (MUST requirement)
export const FX_SOURCES: FxSource[] = [
  {
    name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    parseResponse: (data) => (data as { bitcoin: { usd: number } }).bitcoin.usd
  },
  {
    name: 'CoinDesk',
    url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
    parseResponse: (data) => parseFloat((data as { bpi: { USD: { rate: string } } }).bpi.USD.rate.replace(/,/g, ''))
  }
];

export class FxManager {
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static cache: Map<string, { rate: FxRate; expiry: number }> = new Map();

  static async fetchBitcoinPrice(source: FxSource): Promise<number> {
    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return source.parseResponse(data);
    } catch (error) {
      throw new Error(`Failed to fetch from ${source.name}: ${error}`);
    }
  }

  static async getCurrentRate(currency: string = 'USD'): Promise<FxRate> {
    const cacheKey = currency.toUpperCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.rate;
    }

    // Try each source until one succeeds
    let lastError: Error | null = null;
    
    for (const source of FX_SOURCES) {
      try {
        const priceUsd = await this.fetchBitcoinPrice(source);
        
        // Convert to target currency if not USD
        const priceInCurrency = priceUsd;
        if (currency !== 'USD') {
          // For MVP, we'll only support USD. Could extend with currency conversion API
          throw new Error(`Currency ${currency} not supported yet`);
        }
        
        // Convert to sats per unit (1 BTC = 100,000,000 sats)
        const satsPerUnit = Math.floor(100_000_000 / priceInCurrency);
        
        const rate: FxRate = {
          currency: currency.toUpperCase(),
          rate: satsPerUnit,
          source: source.name,
          timestamp: Date.now()
        };
        
        // Cache the result
        this.cache.set(cacheKey, {
          rate,
          expiry: Date.now() + this.CACHE_DURATION
        });
        
        return rate;
      } catch (error) {
        lastError = error as Error;
        console.warn(`FX source ${source.name} failed:`, error);
        continue;
      }
    }
    
    throw new Error(`All FX sources failed. Last error: ${lastError?.message}`);
  }

  static convertToSats(amount: number, fxRate: FxRate): number {
    // REQ-CUR-003: Round down per-person share to sats
    return Math.floor(amount * fxRate.rate);
  }

  static formatFxRateForEvent(fxRate: FxRate): string[] {
    // Format for Nostr event tag: ["fx", "<rate>", "<source>", "<timestamp_iso>"]
    return [
      fxRate.rate.toString(),
      fxRate.source,
      new Date(fxRate.timestamp).toISOString()
    ];
  }

  // Manual rate entry fallback
  static createManualRate(currency: string, satsPerUnit: number): FxRate {
    return {
      currency: currency.toUpperCase(),
      rate: satsPerUnit,
      source: 'Manual Entry',
      timestamp: Date.now()
    };
  }
}
