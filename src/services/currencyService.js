/**
 * Currency Service
 * Handles currency detection, conversion, and formatting for international pricing
 */

// Currency mappings for common countries
const COUNTRY_CURRENCY_MAP = {
  // Middle East
  AE: 'AED', // United Arab Emirates
  SA: 'SAR', // Saudi Arabia
  KW: 'KWD', // Kuwait
  QA: 'QAR', // Qatar
  OM: 'OMR', // Oman
  BH: 'BHD', // Bahrain

  // Africa
  ET: 'ETB', // Ethiopia
  EG: 'EGP', // Egypt
  KE: 'KES', // Kenya
  NG: 'NGN', // Nigeria
  ZA: 'ZAR', // South Africa

  // Europe
  GB: 'GBP', // United Kingdom
  EU: 'EUR', // European Union (generic)
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain

  // Americas
  US: 'USD', // United States
  CA: 'CAD', // Canada

  // Asia
  IN: 'INR', // India
  CN: 'CNY', // China
  JP: 'JPY', // Japan
  SG: 'SGD', // Singapore
};

// Exchange rates cache (refreshed every hour)
let exchangeRatesCache = {
  rates: {},
  lastUpdated: null,
  baseCurrency: 'AED', // Our Stripe prices are in AED
};

/**
 * Detect user's country from IP geolocation
 * Falls back to UAE (AED) if detection fails
 */
export const detectUserCountry = async () => {
  try {
    // Try ipapi.co first (free, reliable, no key required)
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Geolocation API failed');
    }

    const data = await response.json();
    return {
      countryCode: data.country_code || 'AE',
      countryName: data.country_name || 'United Arab Emirates',
      currency: COUNTRY_CURRENCY_MAP[data.country_code] || 'AED',
    };
  } catch (error) {
    console.warn('Country detection failed, defaulting to UAE:', error);
    // Default to UAE since our Stripe is configured for AED
    return {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      currency: 'AED',
    };
  }
};

/**
 * Fetch exchange rates from exchangerate-api.com
 * Uses free tier (1500 requests/month)
 */
export const fetchExchangeRates = async () => {
  try {
    // Check cache first (refresh every hour)
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (exchangeRatesCache.lastUpdated &&
        (now - exchangeRatesCache.lastUpdated) < oneHour &&
        Object.keys(exchangeRatesCache.rates).length > 0) {
      return exchangeRatesCache.rates;
    }

    // Fetch fresh rates
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/AED');

    if (!response.ok) {
      throw new Error('Exchange rate API failed');
    }

    const data = await response.json();

    // Update cache
    exchangeRatesCache = {
      rates: data.rates,
      lastUpdated: now,
      baseCurrency: 'AED',
    };

    return data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // Return fallback rates if API fails
    return getFallbackRates();
  }
};

/**
 * Fallback exchange rates (updated manually, approximate rates)
 * Used if the exchange rate API is unavailable
 */
const getFallbackRates = () => {
  return {
    AED: 1.0,      // Base currency
    USD: 0.27,     // 1 AED = 0.27 USD
    EUR: 0.25,     // 1 AED = 0.25 EUR
    GBP: 0.21,     // 1 AED = 0.21 GBP
    SAR: 1.02,     // 1 AED = 1.02 SAR
    ETB: 15.30,    // 1 AED = 15.30 ETB
    EGP: 13.35,    // 1 AED = 13.35 EGP
    KES: 35.20,    // 1 AED = 35.20 KES
    NGN: 430.00,   // 1 AED = 430 NGN
    ZAR: 4.95,     // 1 AED = 4.95 ZAR
    INR: 22.70,    // 1 AED = 22.70 INR
    CAD: 0.38,     // 1 AED = 0.38 CAD
    CNY: 1.96,     // 1 AED = 1.96 CNY
    JPY: 40.50,    // 1 AED = 40.50 JPY
    SGD: 0.36,     // 1 AED = 0.36 SGD
  };
};

/**
 * Convert price from AED to target currency
 * @param {number} priceInAED - Price in AED (our base currency)
 * @param {string} targetCurrency - Target currency code (e.g., 'USD', 'EUR')
 * @returns {number} Converted price
 */
export const convertCurrency = async (priceInAED, targetCurrency) => {
  if (targetCurrency === 'AED') {
    return priceInAED;
  }

  try {
    const rates = await fetchExchangeRates();
    const rate = rates[targetCurrency];

    if (!rate) {
      console.warn(`Exchange rate not found for ${targetCurrency}, using fallback`);
      const fallbackRates = getFallbackRates();
      const fallbackRate = fallbackRates[targetCurrency] || fallbackRates.USD;
      return priceInAED * fallbackRate;
    }

    return priceInAED * rate;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    // If conversion fails, return original price
    return priceInAED;
  }
};

/**
 * Format price with proper currency symbol and locale
 * @param {number} price - Price to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted price string
 */
export const formatCurrency = (price, currency = 'USD', locale = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    console.error('Currency formatting failed:', error);
    // Fallback to basic formatting
    return `${currency.toUpperCase()} ${price.toFixed(2)}`;
  }
};

/**
 * Get user's preferred currency from localStorage or detect it
 * @returns {Promise<object>} Currency info object
 */
export const getUserCurrency = async () => {
  // Check localStorage first
  const savedCurrency = localStorage.getItem('userCurrency');

  if (savedCurrency) {
    try {
      return JSON.parse(savedCurrency);
    } catch (error) {
      console.warn('Invalid saved currency, detecting new one');
    }
  }

  // Detect from IP if not saved
  const countryInfo = await detectUserCountry();

  // Save to localStorage
  const currencyInfo = {
    currency: countryInfo.currency,
    countryCode: countryInfo.countryCode,
    countryName: countryInfo.countryName,
  };

  localStorage.setItem('userCurrency', JSON.stringify(currencyInfo));

  return currencyInfo;
};

/**
 * Set user's preferred currency manually
 * @param {string} currency - Currency code
 * @param {string} countryCode - Country code
 * @param {string} countryName - Country name
 */
export const setUserCurrency = (currency, countryCode, countryName) => {
  const currencyInfo = {
    currency,
    countryCode,
    countryName,
  };

  localStorage.setItem('userCurrency', JSON.stringify(currencyInfo));

  return currencyInfo;
};

/**
 * Get converted price with formatting
 * Main function to use in components
 * @param {number} priceInAED - Original price in AED
 * @param {string} targetCurrency - Target currency (optional, auto-detected if not provided)
 * @returns {Promise<object>} Object with converted price and formatted string
 */
export const getConvertedPrice = async (priceInAED, targetCurrency = null) => {
  try {
    // Get user's currency if not provided
    const currencyInfo = targetCurrency
      ? { currency: targetCurrency }
      : await getUserCurrency();

    const currency = currencyInfo.currency;

    // Convert the price
    const convertedPrice = await convertCurrency(priceInAED, currency);

    // Format the price
    const formattedPrice = formatCurrency(convertedPrice, currency);

    return {
      originalPrice: priceInAED,
      originalCurrency: 'AED',
      convertedPrice,
      currency,
      formatted: formattedPrice,
      exchangeRate: convertedPrice / priceInAED,
    };
  } catch (error) {
    console.error('Error getting converted price:', error);

    // Return original price as fallback
    return {
      originalPrice: priceInAED,
      originalCurrency: 'AED',
      convertedPrice: priceInAED,
      currency: 'AED',
      formatted: formatCurrency(priceInAED, 'AED'),
      exchangeRate: 1,
    };
  }
};

/**
 * Preload exchange rates on app initialization
 * Call this early to avoid delays when displaying prices
 */
export const preloadExchangeRates = async () => {
  try {
    await fetchExchangeRates();
    console.log('Exchange rates preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload exchange rates:', error);
  }
};

export default {
  detectUserCountry,
  fetchExchangeRates,
  convertCurrency,
  formatCurrency,
  getUserCurrency,
  setUserCurrency,
  getConvertedPrice,
  preloadExchangeRates,
};
