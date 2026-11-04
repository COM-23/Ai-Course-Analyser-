export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

// 45 real student destination countries directly from programs.csv dataset
export const ALL_TARGET_COUNTRIES: string[] = [
  "United States of America",
  "United Kingdom",
  "Canada",
  "Australia",
  "New Zealand",
  "Ireland",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Singapore",
  "United Arab Emirates",
  "Malaysia",
  "Japan",
  "Austria",
  "Bahrain",
  "Belgium",
  "China",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Finland",
  "Georgia",
  "Greece",
  "Hungary",
  "Indonesia",
  "Kazakhstan",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Mauritius",
  "Monaco",
  "Russia",
  "Saudi Arabia",
  "Slovenia",
  "South Korea",
  "Sri Lanka",
  "Thailand",
  "Turkey",
  "Vietnam",
  "Not Decided"
];

export const COUNTRY_CURRENCY_MAP: Record<string, { currency: string; symbol: string }> = {
  "united states of america": { currency: "USD", symbol: "$" },
  "united states": { currency: "USD", symbol: "$" },
  "usa": { currency: "USD", symbol: "$" },
  "united kingdom": { currency: "GBP", symbol: "£" },
  "uk": { currency: "GBP", symbol: "£" },
  "canada": { currency: "CAD", symbol: "CA$" },
  "australia": { currency: "AUD", symbol: "AU$" },
  "new zealand": { currency: "NZD", symbol: "NZ$" },
  "ireland": { currency: "EUR", symbol: "€" },
  "germany": { currency: "EUR", symbol: "€" },
  "france": { currency: "EUR", symbol: "€" },
  "italy": { currency: "EUR", symbol: "€" },
  "spain": { currency: "EUR", symbol: "€" },
  "netherlands": { currency: "EUR", symbol: "€" },
  "switzerland": { currency: "CHF", symbol: "CHF " },
  "sweden": { currency: "SEK", symbol: "kr " },
  "singapore": { currency: "SGD", symbol: "S$" },
  "singapore/apj": { currency: "SGD", symbol: "S$" },
  "united arab emirates": { currency: "AED", symbol: "AED " },
  "uae/middle east": { currency: "AED", symbol: "AED " },
  "uae": { currency: "AED", symbol: "AED " },
  "malaysia": { currency: "MYR", symbol: "RM " },
  "japan": { currency: "JPY", symbol: "¥" },
  "austria": { currency: "EUR", symbol: "€" },
  "bahrain": { currency: "BHD", symbol: "BD " },
  "belgium": { currency: "EUR", symbol: "€" },
  "china": { currency: "CNY", symbol: "¥" },
  "croatia": { currency: "EUR", symbol: "€" },
  "cyprus": { currency: "EUR", symbol: "€" },
  "czech republic": { currency: "EUR", symbol: "€" },
  "denmark": { currency: "EUR", symbol: "€" },
  "finland": { currency: "EUR", symbol: "€" },
  "georgia": { currency: "USD", symbol: "$" },
  "greece": { currency: "EUR", symbol: "€" },
  "hungary": { currency: "EUR", symbol: "€" },
  "indonesia": { currency: "IDR", symbol: "Rp " },
  "kazakhstan": { currency: "USD", symbol: "$" },
  "latvia": { currency: "EUR", symbol: "€" },
  "lithuania": { currency: "EUR", symbol: "€" },
  "luxembourg": { currency: "EUR", symbol: "€" },
  "malta": { currency: "EUR", symbol: "€" },
  "mauritius": { currency: "MUR", symbol: "Rs " },
  "monaco": { currency: "EUR", symbol: "€" },
  "russia": { currency: "USD", symbol: "$" },
  "saudi arabia": { currency: "SAR", symbol: "SAR " },
  "slovenia": { currency: "EUR", symbol: "€" },
  "south korea": { currency: "KRW", symbol: "₩" },
  "sri lanka": { currency: "USD", symbol: "$" },
  "thailand": { currency: "THB", symbol: "฿" },
  "turkey": { currency: "USD", symbol: "$" },
  "vietnam": { currency: "VND", symbol: "₫" },
  "india": { currency: "INR", symbol: "₹" },
  "not decided": { currency: "USD", symbol: "$" }
};

export function getCountryCurrencyInfo(countryName: string): { currency: string; symbol: string } {
  if (!countryName) return { currency: "USD", symbol: "$" };
  const lower = countryName.toLowerCase().trim();
  if (COUNTRY_CURRENCY_MAP[lower]) return COUNTRY_CURRENCY_MAP[lower];
  for (const [key, val] of Object.entries(COUNTRY_CURRENCY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return { currency: "USD", symbol: "$" };
}

// Comprehensive realistic 2026 market standards for all global student destinations
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  INR: 94.90,
  EUR: 0.892,
  GBP: 0.747,
  CAD: 1.401,
  AUD: 1.425,
  NZD: 1.760,
  AED: 3.673,
  SGD: 1.277,
  MYR: 4.083,
  CHF: 0.821,
  SEK: 9.910,
  JPY: 156.92,
  HKD: 7.837,
  CNY: 6.688,
  SAR: 3.750,
  KRW: 1324.95,
  THB: 33.73,
  IDR: 18082.48,
  MUR: 47.27,
  BHD: 0.376,
  GEL: 2.60,
  PLN: 3.90,
  DKK: 6.67,
  NOK: 9.34,
  HUF: 365.20,
  CZK: 23.40,
  TRY: 34.25,
  VND: 25450,
  KZT: 485.50,
  QAR: 3.64,
  KWD: 0.31,
  OMR: 0.385,
  ZAR: 16.50
};

let cachedRates: { data: Record<string, number>; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && (now - cachedRates.timestamp) < CACHE_TTL_MS) {
    return cachedRates.data;
  }

  // Helper to merge rates safely
  const mergeRates = (sourceRates: Record<string, any>): Record<string, number> => {
    const clean: Record<string, number> = { ...FALLBACK_RATES };
    for (const [k, v] of Object.entries(sourceRates)) {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      if (!isNaN(num) && num > 0) {
        clean[k.toUpperCase()] = num;
      }
    }
    return clean;
  };

  // 1. Primary: open.er-api.com (CORS friendly, high uptime)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates && typeof data.rates === 'object' && data.rates.INR) {
        const clean = mergeRates(data.rates);
        cachedRates = { data: clean, timestamp: now };
        return clean;
      }
    }
  } catch (e) {
    // try next provider
  }

  // 2. Secondary: Cloudflare Pages CDN mirror of currency-api (lightning-fast on cloud/Netlify)
  try {
    const res = await fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.usd && typeof data.usd === 'object') {
        const clean = mergeRates(data.usd);
        cachedRates = { data: clean, timestamp: now };
        return clean;
      }
    }
  } catch (e) {
    // try next provider
  }

  // 3. Tertiary: jsdelivr currency-api CDN
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.usd && typeof data.usd === 'object') {
        const clean = mergeRates(data.usd);
        cachedRates = { data: clean, timestamp: now };
        return clean;
      }
    }
  } catch (e) {
    // try next provider
  }

  // 4. Quaternary: api.exchangerate-api.com
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates && typeof data.rates === 'object' && data.rates.INR) {
        const clean = mergeRates(data.rates);
        cachedRates = { data: clean, timestamp: now };
        return clean;
      }
    }
  } catch (e) {
    // Serving verified offline rates
  }

  // Bulletproof fallback: guaranteed instant return on on-premise offline servers or restricted networks
  cachedRates = { data: FALLBACK_RATES, timestamp: now };
  return FALLBACK_RATES;
}
