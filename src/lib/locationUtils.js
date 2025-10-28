// Lightweight browser-side helpers to infer default country and currency
// based on the user's current locale. Falls back safely for unknown regions.

// Minimal ISO country-code to display-name map for our supported regions
const ISO_TO_COUNTRY = {
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  KW: 'Kuwait',
  BH: 'Bahrain',
  OM: 'Oman',
  ET: 'Ethiopia',
  KE: 'Kenya',
  UG: 'Uganda',
  TZ: 'Tanzania',
  PH: 'Philippines',
  ID: 'Indonesia',
  LK: 'Sri Lanka',
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
};

// For salary UI we only allow these currencies.
// Map detected region to the best-fitting option; default to USD otherwise.
const ISO_TO_ALLOWED_CURRENCY = {
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
};

export const getBrowserRegionCode = () => {
  try {
    // Prefer Intl.Locale when available
     
    if (typeof Intl !== 'undefined' && Intl.Locale) {
       
      const loc = new Intl.Locale(navigator.language || (navigator.languages && navigator.languages[0]) || '');
      if (loc && loc.region) return String(loc.region).toUpperCase();
    }
    // Fallback: parse from DateTimeFormat locale
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const loc = Intl.DateTimeFormat().resolvedOptions().locale || '';
      const parts = loc.split(/[-_]/);
      if (parts.length > 1 && parts[1].length === 2) return parts[1].toUpperCase();
    }
  } catch (e) {
    console.warn('locationUtils: failed to detect browser region');
  }
  return '';
};

export const getCountryNameFromRegion = (regionCode) => {
  if (!regionCode) return '';
  return ISO_TO_COUNTRY[regionCode.toUpperCase()] || '';
};

export const getDefaultCurrencyForRegion = (regionCode) => {
  if (!regionCode) return 'USD';
  return ISO_TO_ALLOWED_CURRENCY[regionCode.toUpperCase()] || 'USD';
};

export const getDefaultLocation = () => {
  const region = getBrowserRegionCode();
  const country = getCountryNameFromRegion(region);
  const currency = getDefaultCurrencyForRegion(region);
  return { region, country, currency };
};

export default {
  getBrowserRegionCode,
  getCountryNameFromRegion,
  getDefaultCurrencyForRegion,
  getDefaultLocation,
};
