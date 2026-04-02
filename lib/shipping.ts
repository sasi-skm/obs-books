// THB to USD exchange rate - update manually as needed
export const THB_TO_USD = 0.028

// Default book weight if not set (grams)
export const DEFAULT_BOOK_WEIGHT = 300

// DHL zone mapping from Thailand
// Zone 0 = domestic (free shipping)
export const COUNTRY_ZONES: Record<string, number> = {
  TH: 0,
  // Zone 1 - ASEAN
  SG: 1, MY: 1, ID: 1, PH: 1, VN: 1, MM: 1, KH: 1, LA: 1, BN: 1, TL: 1,
  // Zone 2 - East Asia
  CN: 2, HK: 2, TW: 2, JP: 2, KR: 2, MO: 2, MN: 2,
  // Zone 3 - Oceania
  AU: 3, NZ: 3, FJ: 3, PG: 3,
  // Zone 4 - South Asia
  IN: 4, PK: 4, BD: 4, LK: 4, NP: 4, MV: 4,
  // Zone 5 - Europe
  GB: 5, DE: 5, FR: 5, IT: 5, ES: 5, NL: 5, BE: 5, CH: 5, AT: 5,
  SE: 5, NO: 5, DK: 5, FI: 5, PL: 5, CZ: 5, PT: 5, IE: 5, GR: 5,
  HU: 5, RO: 5, HR: 5, SK: 5, SI: 5, BG: 5, LT: 5, LV: 5, EE: 5,
  LU: 5, MT: 5, CY: 5, IS: 5,
  // Zone 6 - North America
  US: 6, CA: 6, MX: 6,
  // Zone 7 - South/Central America
  BR: 7, AR: 7, CL: 7, CO: 7, PE: 7, EC: 7, UY: 7, CR: 7, PA: 7,
  // Zone 8 - Africa
  ZA: 8, NG: 8, KE: 8, EG: 8, GH: 8, TZ: 8, ET: 8, MA: 8,
  // Zone 9 - Middle East / Central Asia
  SA: 9, AE: 9, QA: 9, KW: 9, BH: 9, OM: 9, IL: 9, TR: 9, RU: 9, JO: 9,
}

// DHL Express rates from Thailand (USD) by zone and weight bracket
// These are approximate published rates - Sasi can update as needed
export const DHL_RATES: Record<number, Array<{ maxGrams: number; usd: number }>> = {
  1: [
    { maxGrams: 500, usd: 18 }, { maxGrams: 1000, usd: 22 },
    { maxGrams: 2000, usd: 30 }, { maxGrams: 3000, usd: 42 },
    { maxGrams: 5000, usd: 55 },
  ],
  2: [
    { maxGrams: 500, usd: 20 }, { maxGrams: 1000, usd: 25 },
    { maxGrams: 2000, usd: 35 }, { maxGrams: 3000, usd: 48 },
    { maxGrams: 5000, usd: 62 },
  ],
  3: [
    { maxGrams: 500, usd: 25 }, { maxGrams: 1000, usd: 32 },
    { maxGrams: 2000, usd: 45 }, { maxGrams: 3000, usd: 62 },
    { maxGrams: 5000, usd: 80 },
  ],
  4: [
    { maxGrams: 500, usd: 22 }, { maxGrams: 1000, usd: 28 },
    { maxGrams: 2000, usd: 40 }, { maxGrams: 3000, usd: 55 },
    { maxGrams: 5000, usd: 70 },
  ],
  5: [
    { maxGrams: 500, usd: 28 }, { maxGrams: 1000, usd: 36 },
    { maxGrams: 2000, usd: 52 }, { maxGrams: 3000, usd: 72 },
    { maxGrams: 5000, usd: 95 },
  ],
  6: [
    { maxGrams: 500, usd: 30 }, { maxGrams: 1000, usd: 40 },
    { maxGrams: 2000, usd: 58 }, { maxGrams: 3000, usd: 80 },
    { maxGrams: 5000, usd: 105 },
  ],
  7: [
    { maxGrams: 500, usd: 35 }, { maxGrams: 1000, usd: 48 },
    { maxGrams: 2000, usd: 70 }, { maxGrams: 3000, usd: 95 },
    { maxGrams: 5000, usd: 125 },
  ],
  8: [
    { maxGrams: 500, usd: 40 }, { maxGrams: 1000, usd: 55 },
    { maxGrams: 2000, usd: 80 }, { maxGrams: 3000, usd: 108 },
    { maxGrams: 5000, usd: 140 },
  ],
  9: [
    { maxGrams: 500, usd: 38 }, { maxGrams: 1000, usd: 52 },
    { maxGrams: 2000, usd: 75 }, { maxGrams: 3000, usd: 100 },
    { maxGrams: 5000, usd: 130 },
  ],
}

export function getShippingRate(countryCode: string, totalGrams: number): number | null {
  const zone = COUNTRY_ZONES[countryCode.toUpperCase()]
  if (zone === undefined || zone === 0) return null
  const brackets = DHL_RATES[zone]
  if (!brackets) return null
  const bracket = brackets.find(b => totalGrams <= b.maxGrams) || brackets[brackets.length - 1]
  return bracket.usd
}

export function thbToUsd(thb: number): number {
  return Math.round(thb * THB_TO_USD * 100) / 100
}

export const SUPPORTED_COUNTRIES = [
  { code: 'TH', name: 'Thailand', nameLocal: 'ไทย (ส่งฟรี)' },
  // ASEAN
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'LA', name: 'Laos' },
  // East Asia
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  // Oceania
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  // South Asia
  { code: 'IN', name: 'India' },
  // Europe
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'GR', name: 'Greece' },
  // North America
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  // South America
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  // Middle East
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  // Africa
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
].sort((a, b) => {
  if (a.code === 'TH') return -1
  if (b.code === 'TH') return 1
  return a.name.localeCompare(b.name)
})
