// Stripe Configuration
// This file manages Stripe initialization and configuration

import { loadStripe } from '@stripe/stripe-js';
import { createLogger } from '@/utils/logger';

const log = createLogger('StripeConfig');

// Get Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  log.warn('Stripe publishable key not found in environment variables');
  log.warn('Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file');
} else {
  log.info('Stripe configuration loaded successfully');
}

// Initialize Stripe
let stripePromise;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
    log.info('Stripe initialized');
  }
  return stripePromise;
};

// Stripe configuration
export const stripeConfig = {
  // Test mode keys (replace with production keys for live environment)
  publishableKey: stripePublishableKey,

  // Supported currencies
  supportedCurrencies: [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  ],

  // Payment methods
  paymentMethods: ['card'],

  // Stripe Elements styling
  elementsAppearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#9333ea', // purple-600
      colorBackground: '#ffffff',
      colorText: '#1f2937', // gray-800
      colorDanger: '#dc2626', // red-600
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '8px',
      },
      '.Input': {
        padding: '12px',
        fontSize: '14px',
        border: '1px solid #e5e7eb',
      },
      '.Input:focus': {
        border: '1px solid #9333ea',
        boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.1)',
      },
      '.Error': {
        fontSize: '13px',
        color: '#dc2626',
      },
    },
  },

  // Error messages
  errorMessages: {
    card_declined: 'Your card was declined. Please try a different card.',
    insufficient_funds: 'Insufficient funds. Please use a different card.',
    expired_card: 'Your card has expired. Please use a different card.',
    incorrect_cvc: 'The CVC number is incorrect. Please check and try again.',
    processing_error: 'An error occurred while processing your card. Please try again.',
    incorrect_number: 'The card number is incorrect. Please check and try again.',
    invalid_expiry_month: 'The expiration month is invalid. Please check and try again.',
    invalid_expiry_year: 'The expiration year is invalid. Please check and try again.',
    generic_error: 'An unexpected error occurred. Please try again.',
  },

  // Success messages
  successMessages: {
    payment_succeeded: 'Payment successful! Thank you for your payment.',
    payment_intent_created: 'Payment initiated successfully.',
  },
};

export default stripeConfig;
