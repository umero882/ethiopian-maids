/**
 * i18n Package - Translation utilities
 *
 * Provides translation functions and locale management.
 */

import enTranslations from './locales/en.json' assert { type: 'json' };
import arTranslations from './locales/ar.json' assert { type: 'json' };

export const translations = {
  en: enTranslations,
  ar: arTranslations,
};

export const supportedLocales = ['en', 'ar'];

export const localeMetadata = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    rtl: false,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
  },
};

/**
 * Get translation by key
 * @param {string} locale - Locale code (en/ar)
 * @param {string} key - Dot-notation key (e.g., "common.buttons.save")
 * @param {Object} params - Interpolation parameters
 * @returns {string} Translated string
 */
export function t(locale, key, params = {}) {
  const keys = key.split('.');
  let value = translations[locale] || translations.en;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          console.warn(`Translation missing: ${key} (locale: ${locale})`);
          return key;
        }
      }
      break;
    }
  }

  // Interpolate parameters
  return interpolate(value, params);
}

/**
 * Interpolate {{variable}} syntax
 */
function interpolate(template, params) {
  if (typeof template !== 'string') return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale) {
  return localeMetadata[locale]?.rtl || false;
}

/**
 * Get locale direction
 */
export function getDirection(locale) {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
