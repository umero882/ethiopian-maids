import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG, validateStripeConfig } from '@/config/stripeConfig';

let stripePromise;

/**
 * Get Stripe instance with real configuration
 */
export const getStripe = () => {
  if (!stripePromise) {
    // Validate configuration first
    const validation = validateStripeConfig();
    if (!validation.isValid) {
      console.error('❌ Stripe configuration invalid:', validation.errors);
      return null;
    }

    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

/**
 * Set custom Stripe publishable key (for testing or environment switching)
 */
export const setStripePublishableKey = (key) => {
  if (key && key.startsWith('pk_')) {
    stripePromise = loadStripe(key);
    /* console.log('✅ Stripe key updated:', key.substring(0, 20) + '...'); */
  } else {
    console.warn('⚠️ Invalid Stripe publishable key provided.');
  }
};

/**
 * Initialize Stripe with validation
 */
export const initializeStripe = async () => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }
    return stripe;
  } catch (error) {
    console.error('❌ Stripe initialization failed:', error);
    throw error;
  }
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = () => {
  const validation = validateStripeConfig();
  return validation.isValid;
};

export default {
  getStripe,
  setStripePublishableKey,
  initializeStripe,
  isStripeConfigured,
};
