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
    name: "CoinGecko",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,aud,hkd,sgd",
    parseResponse: (data) => (data as { bitcoin: { usd: number } }).bitcoin.usd,
  },
  {
    name: "CoinDesk",
    url: "https://api.coindesk.com/v1/bpi/currentprice.json",
    parseResponse: (data) =>
      parseFloat(
        (data as { bpi: { USD: { rate: string } } }).bpi.USD.rate.replace(
          /,/g,
          ""
        )
      ),
  },
];

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "AUD",
  "HKD",
  "SGD",
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Currency conversion rates relative to USD (updated periodically)
// Using fallback rates from a free API or cached rates
const CURRENCY_CONVERSION_CACHE: Map<string, { rate: number; expiry: number }> =
  new Map();

export class FxManager {
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static cache: Map<string, { rate: FxRate; expiry: number }> =
    new Map();

  // Fetch currency conversion rates from a free API
  private static async fetchCurrencyRates(): Promise<Record<string, number>> {
    try {
      // Using exchangerate-api.com free tier (1500 requests/month)
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.rates as Record<string, number>;
    } catch (error) {
      // Fallback to cached rates or approximate rates
      console.warn(
        "Failed to fetch live currency rates, using fallback:",
        error
      );
      return {
        EUR: 0.85, // Approximate rates as fallback
        AUD: 1.5,
        HKD: 7.8,
        SGD: 1.35,
        USD: 1.0,
      };
    }
  }

  private static async getCurrencyRate(
    targetCurrency: string
  ): Promise<number> {
    if (targetCurrency === "USD") return 1.0;

    const cacheKey = `currency_${targetCurrency}`;
    const cached = CURRENCY_CONVERSION_CACHE.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      return cached.rate;
    }

    try {
      const rates = await this.fetchCurrencyRates();
      const rate = rates[targetCurrency];

      if (!rate) {
        throw new Error(`Currency ${targetCurrency} not found in rates`);
      }

      // Cache the rate
      CURRENCY_CONVERSION_CACHE.set(cacheKey, {
        rate,
        expiry: Date.now() + this.CACHE_DURATION,
      });

      return rate;
    } catch (error) {
      throw new Error(
        `Failed to get currency rate for ${targetCurrency}: ${error}`
      );
    }
  }

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

  static async getCurrentRate(currency: string = "USD"): Promise<FxRate> {
    const cacheKey = currency.toUpperCase();
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      return cached.rate;
    }

    // Validate currency is supported
    if (!SUPPORTED_CURRENCIES.includes(cacheKey as SupportedCurrency)) {
      throw new Error(
        `Currency ${currency} is not supported. Supported currencies: ${SUPPORTED_CURRENCIES.join(
          ", "
        )}`
      );
    }

    // Try each source until one succeeds
    let lastError: Error | null = null;

    for (const source of FX_SOURCES) {
      try {
        const priceUsd = await this.fetchBitcoinPrice(source);

        // Convert to target currency if not USD
        let priceInCurrency = priceUsd;
        if (currency !== "USD") {
          const currencyRate = await this.getCurrencyRate(cacheKey);
          priceInCurrency = priceUsd * currencyRate;
        }

        // Convert to sats per unit (1 BTC = 100,000,000 sats)
        const satsPerUnit = Math.floor(100_000_000 / priceInCurrency);

        const rate: FxRate = {
          currency: currency.toUpperCase(),
          rate: satsPerUnit,
          source: source.name,
          timestamp: Date.now(),
        };

        // Cache the result
        this.cache.set(cacheKey, {
          rate,
          expiry: Date.now() + this.CACHE_DURATION,
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
      new Date(fxRate.timestamp).toISOString(),
    ];
  }

  // Manual rate entry fallback
  static createManualRate(currency: string, satsPerUnit: number): FxRate {
    return {
      currency: currency.toUpperCase(),
      rate: satsPerUnit,
      source: "Manual Entry",
      timestamp: Date.now(),
    };
  }

  // Get currency symbol for display
  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      AUD: "A$",
      HKD: "HK$",
      SGD: "S$",
    };
    return symbols[currency.toUpperCase()] || currency.toUpperCase();
  }

  // Get currency display name
  static getCurrencyName(currency: string): string {
    const names: Record<string, string> = {
      USD: "US Dollar",
      EUR: "Euro",
      AUD: "Australian Dollar",
      HKD: "Hong Kong Dollar",
      SGD: "Singapore Dollar",
    };
    return names[currency.toUpperCase()] || currency.toUpperCase();
  }
}
