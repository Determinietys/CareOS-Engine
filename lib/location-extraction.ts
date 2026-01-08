import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';
import { lookupPhoneNumber } from './twilio';

/**
 * Country code to currency mapping
 */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  NG: 'NGN',
  KE: 'KES',
  ZA: 'ZAR',
  IN: 'INR',
  PK: 'PKR',
  BD: 'BDT',
  PH: 'PHP',
  ID: 'IDR',
  TH: 'THB',
  VN: 'VND',
  MY: 'MYR',
  SG: 'SGD',
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  EG: 'EGP',
  AE: 'AED',
  SA: 'SAR',
  TR: 'TRY',
  RU: 'RUB',
  PL: 'PLN',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
};

/**
 * Country code to country name mapping
 */
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  NG: 'Nigeria',
  KE: 'Kenya',
  ZA: 'South Africa',
  IN: 'India',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  PH: 'Philippines',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  MY: 'Malaysia',
  SG: 'Singapore',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  MX: 'Mexico',
  BR: 'Brazil',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  EG: 'Egypt',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  TR: 'Turkey',
  RU: 'Russia',
  PL: 'Poland',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  AT: 'Austria',
  CH: 'Switzerland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
};

export interface LocationData {
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  currency?: string;
}

/**
 * Extract location from phone number
 */
export async function extractLocationFromPhone(phone: string): Promise<LocationData> {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    const countryCode = phoneNumber.country as CountryCode;
    
    if (!countryCode) {
      return {};
    }

    // Get additional info from Twilio Lookup
    const lookup = await lookupPhoneNumber(phone);
    
    return {
      country: countryCode,
      countryName: COUNTRY_NAMES[countryCode] || countryCode,
      currency: COUNTRY_TO_CURRENCY[countryCode] || 'USD',
      // Twilio lookup might provide more details
      region: lookup?.carrier?.name ? undefined : undefined, // Could extract from carrier
    };
  } catch (error) {
    console.error('Error extracting location from phone:', error);
    return {};
  }
}

/**
 * Extract location from message text using AI/keyword matching
 */
export function extractLocationFromText(text: string): Partial<LocationData> {
  const lower = text.toLowerCase();
  
  // Common location keywords
  const locationPatterns: Array<{ pattern: RegExp; country: string; countryName: string; currency: string }> = [
    { pattern: /\b(nigeria|lagos|abuja|kano|ibadan)\b/i, country: 'NG', countryName: 'Nigeria', currency: 'NGN' },
    { pattern: /\b(kenya|nairobi|mombasa)\b/i, country: 'KE', countryName: 'Kenya', currency: 'KES' },
    { pattern: /\b(south africa|cape town|johannesburg|durban)\b/i, country: 'ZA', countryName: 'South Africa', currency: 'ZAR' },
    { pattern: /\b(india|mumbai|delhi|bangalore|chennai)\b/i, country: 'IN', countryName: 'India', currency: 'INR' },
    { pattern: /\b(pakistan|karachi|lahore|islamabad)\b/i, country: 'PK', countryName: 'Pakistan', currency: 'PKR' },
    { pattern: /\b(bangladesh|dhaka|chittagong)\b/i, country: 'BD', countryName: 'Bangladesh', currency: 'BDT' },
    { pattern: /\b(philippines|manila|cebu|davao)\b/i, country: 'PH', countryName: 'Philippines', currency: 'PHP' },
    { pattern: /\b(indonesia|jakarta|surabaya|bandung)\b/i, country: 'ID', countryName: 'Indonesia', currency: 'IDR' },
    { pattern: /\b(uk|united kingdom|london|manchester|birmingham)\b/i, country: 'GB', countryName: 'United Kingdom', currency: 'GBP' },
    { pattern: /\b(usa|united states|us|new york|los angeles|chicago)\b/i, country: 'US', countryName: 'United States', currency: 'USD' },
    { pattern: /\b(canada|toronto|vancouver|montreal)\b/i, country: 'CA', countryName: 'Canada', currency: 'CAD' },
    { pattern: /\b(australia|sydney|melbourne|brisbane)\b/i, country: 'AU', countryName: 'Australia', currency: 'AUD' },
  ];

  for (const { pattern, country, countryName, currency } of locationPatterns) {
    if (pattern.test(lower)) {
      // Try to extract city
      const cityMatch = lower.match(/\b(lagos|abuja|nairobi|mumbai|delhi|karachi|manila|jakarta|london|new york|toronto|sydney)\b/i);
      
      return {
        country,
        countryName,
        currency,
        city: cityMatch ? cityMatch[1] : undefined,
      };
    }
  }

  return {};
}

/**
 * Extract budget from message text
 */
export function extractBudgetFromText(text: string, currency?: string): {
  budget?: number;
  budgetUSD?: number;
  currency?: string;
} {
  // Match patterns like: $25, 25 USD, 25 dollars, NGN 5000, 5000 NGN, etc.
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*(?:usd|dollars?)?/i,
    /(\d+(?:\.\d+)?)\s*(?:usd|dollars?)/i,
    /(?:ngn|naira)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:ngn|naira)/i,
    /(?:gbp|pounds?)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:gbp|pounds?)/i,
    /(?:kes|kenyan shillings?)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:kes|kenyan shillings?)/i,
    /(?:zar|rand)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:zar|rand)/i,
    /(?:inr|rupees?)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:inr|rupees?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      if (!isNaN(amount)) {
        // Detect currency from pattern
        let detectedCurrency = currency || 'USD';
        if (pattern.source.includes('ngn|naira')) detectedCurrency = 'NGN';
        else if (pattern.source.includes('gbp|pound')) detectedCurrency = 'GBP';
        else if (pattern.source.includes('kes')) detectedCurrency = 'KES';
        else if (pattern.source.includes('zar|rand')) detectedCurrency = 'ZAR';
        else if (pattern.source.includes('inr|rupee')) detectedCurrency = 'INR';
        else if (pattern.source.includes('usd|dollar')) detectedCurrency = 'USD';

        // Convert to USD (simplified - in production, use real-time exchange rates)
        const budgetUSD = convertToUSD(amount, detectedCurrency);

        return {
          budget: amount,
          budgetUSD,
          currency: detectedCurrency,
        };
      }
    }
  }

  return {};
}

/**
 * Convert amount to USD (simplified - use real-time rates in production)
 */
function convertToUSD(amount: number, fromCurrency: string): number {
  // Simplified conversion rates (update with real-time API in production)
  const rates: Record<string, number> = {
    USD: 1,
    NGN: 0.0006, // ~1600 NGN = 1 USD
    GBP: 1.27,
    KES: 0.0065, // ~154 KES = 1 USD
    ZAR: 0.053, // ~19 ZAR = 1 USD
    INR: 0.012, // ~83 INR = 1 USD
    PKR: 0.0036, // ~278 PKR = 1 USD
    BDT: 0.0091, // ~110 BDT = 1 USD
    PHP: 0.018, // ~56 PHP = 1 USD
    IDR: 0.000064, // ~15600 IDR = 1 USD
    CAD: 0.74,
    AUD: 0.66,
    EUR: 1.09,
  };

  const rate = rates[fromCurrency] || 1;
  return amount * rate;
}

/**
 * Combine location data from multiple sources
 */
export async function extractLocation(
  phone?: string,
  message?: string,
  userLocation?: Partial<LocationData>
): Promise<LocationData> {
  const location: LocationData = {};

  // Priority 1: User's stored location
  if (userLocation) {
    Object.assign(location, userLocation);
  }

  // Priority 2: Extract from message text
  if (message) {
    const textLocation = extractLocationFromText(message);
    Object.assign(location, textLocation);
  }

  // Priority 3: Extract from phone number (if no country yet)
  if (phone && !location.country) {
    const phoneLocation = await extractLocationFromPhone(phone);
    Object.assign(location, phoneLocation);
  }

  return location;
}

