import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('CountryService');

/**
 * Country Service
 * Handles all country-related database operations
 */

// Comprehensive country list organized by region
const FALLBACK_COUNTRIES = [
  // GCC Countries (Primary destinations)
  { code: 'AE', name: 'United Arab Emirates', is_gcc: true, is_active: true, flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', is_gcc: true, is_active: true, flag: '🇸🇦' },
  { code: 'KW', name: 'Kuwait', is_gcc: true, is_active: true, flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', is_gcc: true, is_active: true, flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', is_gcc: true, is_active: true, flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', is_gcc: true, is_active: true, flag: '🇴🇲' },

  // East African Countries (Primary source)
  { code: 'ET', name: 'Ethiopia', is_gcc: false, is_active: true, flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', is_gcc: false, is_active: true, flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', is_gcc: false, is_active: true, flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', is_gcc: false, is_active: true, flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', is_gcc: false, is_active: true, flag: '🇷🇼' },
  { code: 'ER', name: 'Eritrea', is_gcc: false, is_active: true, flag: '🇪🇷' },

  // Southeast Asian Countries (Major source)
  { code: 'PH', name: 'Philippines', is_gcc: false, is_active: true, flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', is_gcc: false, is_active: true, flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', is_gcc: false, is_active: true, flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', is_gcc: false, is_active: true, flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', is_gcc: false, is_active: true, flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', is_gcc: false, is_active: true, flag: '🇲🇲' },

  // South Asian Countries
  { code: 'IN', name: 'India', is_gcc: false, is_active: true, flag: '🇮🇳' },
  { code: 'LK', name: 'Sri Lanka', is_gcc: false, is_active: true, flag: '🇱🇰' },
  { code: 'BD', name: 'Bangladesh', is_gcc: false, is_active: true, flag: '🇧🇩' },
  { code: 'NP', name: 'Nepal', is_gcc: false, is_active: true, flag: '🇳🇵' },
  { code: 'PK', name: 'Pakistan', is_gcc: false, is_active: true, flag: '🇵🇰' },

  // Other Middle Eastern Countries
  { code: 'JO', name: 'Jordan', is_gcc: false, is_active: true, flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', is_gcc: false, is_active: true, flag: '🇱🇧' },
  { code: 'SY', name: 'Syria', is_gcc: false, is_active: true, flag: '🇸🇾' },
  { code: 'IQ', name: 'Iraq', is_gcc: false, is_active: true, flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', is_gcc: false, is_active: true, flag: '🇮🇷' },

  // North African Countries
  { code: 'EG', name: 'Egypt', is_gcc: false, is_active: true, flag: '🇪🇬' },
  { code: 'SD', name: 'Sudan', is_gcc: false, is_active: true, flag: '🇸🇩' },
  { code: 'MA', name: 'Morocco', is_gcc: false, is_active: true, flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', is_gcc: false, is_active: true, flag: '🇹🇳' },

  // West African Countries
  { code: 'NG', name: 'Nigeria', is_gcc: false, is_active: true, flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', is_gcc: false, is_active: true, flag: '🇬🇭' },
  { code: 'SN', name: 'Senegal', is_gcc: false, is_active: true, flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', is_gcc: false, is_active: true, flag: '🇨🇲' },

  // Other Common Countries
  { code: 'US', name: 'United States', is_gcc: false, is_active: true, flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', is_gcc: false, is_active: true, flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', is_gcc: false, is_active: true, flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', is_gcc: false, is_active: true, flag: '🇦🇺' },
  { code: 'FR', name: 'France', is_gcc: false, is_active: true, flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', is_gcc: false, is_active: true, flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', is_gcc: false, is_active: true, flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', is_gcc: false, is_active: true, flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', is_gcc: false, is_active: true, flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', is_gcc: false, is_active: true, flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', is_gcc: false, is_active: true, flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', is_gcc: false, is_active: true, flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', is_gcc: false, is_active: true, flag: '🇩🇰' },
  { code: 'JP', name: 'Japan', is_gcc: false, is_active: true, flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', is_gcc: false, is_active: true, flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', is_gcc: false, is_active: true, flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', is_gcc: false, is_active: true, flag: '🇭🇰' },
  { code: 'CN', name: 'China', is_gcc: false, is_active: true, flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', is_gcc: false, is_active: true, flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', is_gcc: false, is_active: true, flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', is_gcc: false, is_active: true, flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', is_gcc: false, is_active: true, flag: '🇨🇱' },
  { code: 'ZA', name: 'South Africa', is_gcc: false, is_active: true, flag: '🇿🇦' },
  { code: 'TR', name: 'Turkey', is_gcc: false, is_active: true, flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', is_gcc: false, is_active: true, flag: '🇷🇺' },
].sort((a, b) => {
  // Sort GCC countries first, then alphabetically
  if (a.is_gcc && !b.is_gcc) return -1;
  if (!a.is_gcc && b.is_gcc) return 1;
  return a.name.localeCompare(b.name);
});

export const countryService = {
  /**
   * Get all active countries
   */
  async getActiveCountries() {
    try {
      // For local development, directly return fallback countries
      // since we don't have a countries table in the local database
      if (import.meta.env.DEV) {
        log.info('Using fallback countries for local development');
        return FALLBACK_COUNTRIES;
      }

      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

      if (error) {
        log.warn('Database error, using fallback countries:', error);
        return FALLBACK_COUNTRIES;
      }
      return data || FALLBACK_COUNTRIES;
    } catch (error) {
      log.error('Error fetching countries, using fallback:', error);
      return FALLBACK_COUNTRIES;
    }
  },

  /**
   * Get GCC countries only
   */
  async getGCCCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_gcc', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Error fetching GCC countries:', error);
      throw error;
    }
  },

  /**
   * Get country by code
   */
  async getCountryByCode(code) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Error fetching country by code:', error);
      throw error;
    }
  },

  /**
   * Search countries by name
   */
  async searchCountries(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Error searching countries:', error);
      throw error;
    }
  },
};

export default countryService;
