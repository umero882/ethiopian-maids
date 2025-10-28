import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Supported locales
export const SUPPORTED_LOCALES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
  },
};

const LocalizationContext = createContext();

const initialState = {
  currentLocale: 'en',
  translations: {},
  isLoading: false,
  isRTL: false,
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h',
  currency: 'AED',
  numberFormat: 'en-US',
};

const localizationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOCALE':
      return {
        ...state,
        currentLocale: action.payload.locale,
        isRTL: SUPPORTED_LOCALES[action.payload.locale]?.rtl || false,
      };
    case 'SET_TRANSLATIONS':
      return {
        ...state,
        translations: {
          ...state.translations,
          [action.payload.locale]: action.payload.translations,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_DATE_FORMAT':
      return {
        ...state,
        dateFormat: action.payload,
      };
    case 'SET_TIME_FORMAT':
      return {
        ...state,
        timeFormat: action.payload,
      };
    case 'SET_CURRENCY':
      return {
        ...state,
        currency: action.payload,
      };
    case 'SET_NUMBER_FORMAT':
      return {
        ...state,
        numberFormat: action.payload,
      };
    default:
      return state;
  }
};

export const LocalizationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(localizationReducer, initialState);

  // Load translations for a specific locale
  const loadTranslations = useCallback(async (locale) => {
    if (state.translations[locale]) {
      return state.translations[locale];
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Dynamic import of translation files
      const translationModule = await import(`../locales/${locale}.json`);
      const translations = translationModule.default;

      dispatch({
        type: 'SET_TRANSLATIONS',
        payload: { locale, translations },
      });

      return translations;
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error);

      // Fallback to English if translation loading fails
      if (locale !== 'en') {
        return loadTranslations('en');
      }

      return {};
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.translations]);

  // Change locale
  const changeLocale = useCallback(async (locale) => {
    if (!SUPPORTED_LOCALES[locale]) {
      console.error(`Unsupported locale: ${locale}`);
      return;
    }

    dispatch({ type: 'SET_LOCALE', payload: { locale } });
    await loadTranslations(locale);

    // Persist locale preference
    localStorage.setItem('preferred-locale', locale);

    // Update document direction
    document.documentElement.dir = SUPPORTED_LOCALES[locale].rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    // Announce locale change to screen readers
    if (typeof window !== 'undefined' && window.announceToScreenReader) {
      const localeName = SUPPORTED_LOCALES[locale].name;
      window.announceToScreenReader(`Language changed to ${localeName}`, 'polite');
    }
  }, [loadTranslations]);

  // Get translation with interpolation support
  const t = useCallback((key, params = {}) => {
    const translations = state.translations[state.currentLocale] || {};

    // Handle nested keys (e.g., "common.buttons.save")
    const value = key.split('.').reduce((obj, k) => obj?.[k], translations);

    if (value === undefined) {
      // Fallback to English if translation not found
      const englishTranslations = state.translations['en'] || {};
      const fallbackValue = key.split('.').reduce((obj, k) => obj?.[k], englishTranslations);

      if (fallbackValue === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key; // Return the key itself as fallback
      }

      return interpolate(fallbackValue, params);
    }

    return interpolate(value, params);
  }, [state.translations, state.currentLocale]);

  // Pluralization support
  const tp = useCallback((key, count, params = {}) => {
    const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
    return t(pluralKey, { count, ...params });
  }, [t]);

  // Format date according to locale
  const formatDate = useCallback((date, options = {}) => {
    const dateObj = new Date(date);
    const locale = state.currentLocale;

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    try {
      return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateObj.toLocaleDateString('en-US', defaultOptions);
    }
  }, [state.currentLocale]);

  // Format time according to locale
  const formatTime = useCallback((date, options = {}) => {
    const dateObj = new Date(date);
    const locale = state.currentLocale;

    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: state.timeFormat === '12h',
      ...options,
    };

    try {
      return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
    } catch (error) {
      console.error('Time formatting error:', error);
      return dateObj.toLocaleTimeString('en-US', defaultOptions);
    }
  }, [state.currentLocale, state.timeFormat]);

  // Format numbers according to locale
  const formatNumber = useCallback((number, options = {}) => {
    try {
      return new Intl.NumberFormat(state.numberFormat, options).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return number.toString();
    }
  }, [state.numberFormat]);

  // Format currency according to locale
  const formatCurrency = useCallback((amount, options = {}) => {
    const defaultOptions = {
      style: 'currency',
      currency: state.currency,
      ...options,
    };

    return formatNumber(amount, defaultOptions);
  }, [formatNumber, state.currency]);

  // Get relative time (e.g., "2 hours ago")
  const formatRelativeTime = useCallback((date, baseDate = new Date()) => {
    const dateObj = new Date(date);
    const baseDateObj = new Date(baseDate);
    const diffInSeconds = Math.floor((dateObj - baseDateObj) / 1000);

    try {
      const rtf = new Intl.RelativeTimeFormat(state.currentLocale, { numeric: 'auto' });

      const intervals = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2628000 },
        { unit: 'week', seconds: 604800 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 },
        { unit: 'second', seconds: 1 },
      ];

      for (const interval of intervals) {
        const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
        if (count > 0) {
          return rtf.format(diffInSeconds < 0 ? -count : count, interval.unit);
        }
      }

      return rtf.format(0, 'second');
    } catch (error) {
      console.error('Relative time formatting error:', error);
      return dateObj.toLocaleDateString();
    }
  }, [state.currentLocale]);

  // Initialize locale on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('preferred-locale');
    const browserLocale = navigator.language.split('-')[0];
    const initialLocale =
      (savedLocale && SUPPORTED_LOCALES[savedLocale] ? savedLocale : null) ||
      (SUPPORTED_LOCALES[browserLocale] ? browserLocale : 'en');

    changeLocale(initialLocale);
  }, [changeLocale]);

  // Set up locale-specific settings
  const setDateFormat = useCallback((format) => {
    dispatch({ type: 'SET_DATE_FORMAT', payload: format });
  }, []);

  const setTimeFormat = useCallback((format) => {
    dispatch({ type: 'SET_TIME_FORMAT', payload: format });
  }, []);

  const setCurrency = useCallback((currency) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency });
  }, []);

  const setNumberFormat = useCallback((format) => {
    dispatch({ type: 'SET_NUMBER_FORMAT', payload: format });
  }, []);

  const value = {
    // State
    currentLocale: state.currentLocale,
    isLoading: state.isLoading,
    isRTL: state.isRTL,
    supportedLocales: SUPPORTED_LOCALES,

    // Translation functions
    t,
    tp,

    // Locale management
    changeLocale,

    // Formatting functions
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,

    // Settings
    dateFormat: state.dateFormat,
    timeFormat: state.timeFormat,
    currency: state.currency,
    numberFormat: state.numberFormat,
    setDateFormat,
    setTimeFormat,
    setCurrency,
    setNumberFormat,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

// Utility function for string interpolation
function interpolate(template, params) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

// HOC for components that need localization
export const withLocalization = (Component) => {
  return (props) => {
    const localization = useLocalization();
    return <Component {...props} {...localization} />;
  };
};

// Hook for RTL layout support
export const useRTL = () => {
  const { isRTL } = useLocalization();

  const rtlClass = isRTL ? 'rtl' : 'ltr';
  const flipClass = (baseClass) => isRTL ? `${baseClass}-rtl` : baseClass;
  const marginStart = isRTL ? 'marginRight' : 'marginLeft';
  const marginEnd = isRTL ? 'marginLeft' : 'marginRight';
  const paddingStart = isRTL ? 'paddingRight' : 'paddingLeft';
  const paddingEnd = isRTL ? 'paddingLeft' : 'paddingRight';
  const start = isRTL ? 'right' : 'left';
  const end = isRTL ? 'left' : 'right';

  return {
    isRTL,
    rtlClass,
    flipClass,
    marginStart,
    marginEnd,
    paddingStart,
    paddingEnd,
    start,
    end,
  };
};