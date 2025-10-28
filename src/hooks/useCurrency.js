/**
 * useCurrency Hook
 * React hook for handling currency detection, conversion, and formatting
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserCurrency,
  getConvertedPrice,
  preloadExchangeRates,
  setUserCurrency,
} from '../services/currencyService';

/**
 * Custom hook for currency management
 * @returns {object} Currency state and utility functions
 */
export const useCurrency = () => {
  const [currency, setCurrency] = useState({
    currency: 'AED', // Default to AED (Stripe base currency)
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize currency on mount
  useEffect(() => {
    const initCurrency = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Preload exchange rates in parallel
        preloadExchangeRates();

        // Get user's currency
        const userCurrency = await getUserCurrency();
        setCurrency(userCurrency);
      } catch (err) {
        console.error('Failed to initialize currency:', err);
        setError(err.message);
        // Keep default AED currency on error
      } finally {
        setIsLoading(false);
      }
    };

    initCurrency();
  }, []);

  /**
   * Change user's preferred currency
   * @param {string} newCurrency - New currency code
   * @param {string} countryCode - Country code
   * @param {string} countryName - Country name
   */
  const changeCurrency = useCallback((newCurrency, countryCode, countryName) => {
    const updatedCurrency = setUserCurrency(newCurrency, countryCode, countryName);
    setCurrency(updatedCurrency);
  }, []);

  /**
   * Convert and format a price
   * @param {number} priceInAED - Price in AED
   * @returns {Promise<object>} Converted price object
   */
  const convertPrice = useCallback(
    async (priceInAED) => {
      try {
        return await getConvertedPrice(priceInAED, currency.currency);
      } catch (err) {
        console.error('Failed to convert price:', err);
        // Return original price on error
        return {
          originalPrice: priceInAED,
          originalCurrency: 'AED',
          convertedPrice: priceInAED,
          currency: 'AED',
          formatted: `AED ${priceInAED.toFixed(2)}`,
          exchangeRate: 1,
        };
      }
    },
    [currency.currency]
  );

  return {
    currency: currency.currency,
    countryCode: currency.countryCode,
    countryName: currency.countryName,
    isLoading,
    error,
    changeCurrency,
    convertPrice,
  };
};

/**
 * Hook for converting a single price
 * @param {number} priceInAED - Price in AED to convert
 * @returns {object} Converted price state
 */
export const useConvertedPrice = (priceInAED) => {
  const { currency, isLoading: currencyLoading } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const convert = async () => {
      if (currencyLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await getConvertedPrice(priceInAED, currency);
        setConvertedPrice(result);
      } catch (err) {
        console.error('Failed to convert price:', err);
        setError(err.message);
        // Set fallback price
        setConvertedPrice({
          originalPrice: priceInAED,
          originalCurrency: 'AED',
          convertedPrice: priceInAED,
          currency: 'AED',
          formatted: `AED ${priceInAED.toFixed(2)}`,
          exchangeRate: 1,
        });
      } finally {
        setIsLoading(false);
      }
    };

    convert();
  }, [priceInAED, currency, currencyLoading]);

  return {
    ...convertedPrice,
    isLoading: isLoading || currencyLoading,
    error,
  };
};

/**
 * Hook for converting multiple prices at once
 * @param {Array<number>} pricesInAED - Array of prices in AED
 * @returns {object} Converted prices state
 */
export const useConvertedPrices = (pricesInAED) => {
  const { currency, isLoading: currencyLoading } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const convertAll = async () => {
      if (currencyLoading || !pricesInAED || pricesInAED.length === 0) return;

      try {
        setIsLoading(true);
        setError(null);

        // Convert all prices in parallel
        const results = await Promise.all(
          pricesInAED.map((price) => getConvertedPrice(price, currency))
        );

        setConvertedPrices(results);
      } catch (err) {
        console.error('Failed to convert prices:', err);
        setError(err.message);
        // Set fallback prices
        setConvertedPrices(
          pricesInAED.map((price) => ({
            originalPrice: price,
            originalCurrency: 'AED',
            convertedPrice: price,
            currency: 'AED',
            formatted: `AED ${price.toFixed(2)}`,
            exchangeRate: 1,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    convertAll();
  }, [pricesInAED, currency, currencyLoading]);

  return {
    convertedPrices,
    isLoading: isLoading || currencyLoading,
    error,
  };
};

export default useCurrency;
