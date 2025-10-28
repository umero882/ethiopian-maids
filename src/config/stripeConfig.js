/**
 * 🔥 Real Stripe Configuration
 * Production-ready Stripe integration with actual price IDs
 */

// =============================================
// STRIPE PRICE IDS (PRODUCTION)
// =============================================

export const STRIPE_PRICE_IDS = {
  // Maid Plans - MUST be configured in .env file
  // SECURITY: No hardcoded fallbacks - all price IDs must come from environment
  maid: {
    free: null, // Free plan doesn't need a price ID
    pro: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PREMIUM_ANNUAL,
    },
  },

  // Sponsor Plans - MUST be configured in .env file
  sponsor: {
    free: null, // Free plan doesn't need a price ID
    pro: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL,
    },
  },

  // Agency Plans - MUST be configured in .env file
  agency: {
    free: null, // Free plan doesn't need a price ID
    pro: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_AGENCY_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_ANNUAL,
    },
  },
};

// =============================================
// STRIPE CONFIGURATION
// =============================================

export const STRIPE_CONFIG = {
  // Keys from environment variables - NOTE: secretKey should NEVER be in client-side code
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  // REMOVED: secretKey - moved to server-side only for security
  // REMOVED: webhookSecret - moved to server-side only for security
  // SECURITY: No hardcoded fallback keys - must be provided via environment

  // API Configuration
  apiVersion: '2023-10-16',

  // Webhook Events
  webhookEvents: [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'checkout.session.completed',
    'customer.created',
    'customer.updated',
  ],

  // Success/Cancel URLs
  urls: {
    success: '/dashboard?payment=success',
    cancel: '/pricing?payment=cancelled',
    portal: '/dashboard/billing',
  },
};

// =============================================
// SUBSCRIPTION PLANS WITH REAL PRICING
// All prices in AED (Stripe base currency)
// UI will auto-convert to user's local currency
// =============================================

export const SUBSCRIPTION_PLANS_CONFIG = {
  maid: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Basic access for job seekers',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED', // Base currency for all Stripe prices
      features: [
        '100 profile views per month',
        '5 job applications per month',
        '3 message threads',
        'Basic profile listing',
        'Standard customer support',
      ],
      limitations: [
        'No featured profile placement',
        'No verification badge',
        'No direct messaging',
        'Limited visibility to sponsors',
      ],
    },
    pro: {
      id: 'pro',
      name: 'Professional',
      description: 'Enhanced visibility and more opportunities',
      priceId: {
        monthly: STRIPE_PRICE_IDS.maid.pro.monthly,
        annual: STRIPE_PRICE_IDS.maid.pro.annual,
      },
      monthlyPrice: 79, // AED (approx. $21 USD) - Psychological pricing
      annualPrice: 790, // AED (~17% discount, approx. $215 USD)
      currency: 'AED',
      features: [
        '500 profile views per month',
        '25 job applications per month',
        '15 message threads',
        '3 days featured placement',
        'Profile customization',
        '24-hour support response',
        'Direct messaging',
      ],
      popular: true,
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      description: 'Maximum exposure and unlimited access',
      priceId: {
        monthly: STRIPE_PRICE_IDS.maid.premium.monthly,
        annual: STRIPE_PRICE_IDS.maid.premium.annual,
      },
      monthlyPrice: 199, // AED (approx. $54 USD) - Better value positioning
      annualPrice: 1990, // AED (~17% discount, approx. $541 USD)
      currency: 'AED',
      features: [
        'Unlimited profile views',
        'Unlimited job applications',
        'Unlimited message threads',
        '30 days featured placement',
        'Advanced profile customization',
        '6-hour priority support',
        'Verified badge',
        'Direct messaging',
        'Priority in search results',
      ],
    },
  },

  sponsor: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Basic access for employers',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        '1 active job posting',
        '50 candidate searches per month',
        '10 saved candidates',
        '3 message threads',
        'Standard customer support',
      ],
      limitations: [
        'No advanced filters',
        'No AI matching',
        'No direct messaging',
        'Limited candidate access',
      ],
    },
    pro: {
      id: 'pro',
      name: 'Professional',
      description: 'Advanced hiring tools and more reach',
      priceId: {
        monthly: STRIPE_PRICE_IDS.sponsor.pro.monthly,
        annual: STRIPE_PRICE_IDS.sponsor.pro.annual,
      },
      monthlyPrice: 199, // AED (approx. $54 USD) - Psychological pricing
      annualPrice: 1990, // AED (~17% discount, approx. $541 USD)
      currency: 'AED',
      features: [
        '5 active job postings',
        '250 candidate searches per month',
        '50 saved candidates',
        '25 message threads',
        'Advanced search filters',
        '24-hour support response',
        'Direct messaging',
      ],
      popular: true,
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      description: 'Unlimited hiring power with AI matching',
      priceId: {
        monthly: STRIPE_PRICE_IDS.sponsor.premium.monthly,
        annual: STRIPE_PRICE_IDS.sponsor.premium.annual,
      },
      monthlyPrice: 599, // AED (approx. $163 USD) - 3x Pro for clear value
      annualPrice: 5990, // AED (~17% discount, approx. $1630 USD)
      currency: 'AED',
      features: [
        'Unlimited job postings',
        'Unlimited candidate searches',
        'Unlimited saved candidates',
        'Unlimited message threads',
        'Advanced search filters',
        'AI-powered matching',
        '6-hour priority support',
        'Direct messaging',
        'Priority candidate access',
        'Dedicated account manager',
      ],
    },
  },

  agency: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Basic agency management',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        '3 maid listings',
        '5 message threads',
        '10 sponsor connections',
        'Standard customer support',
      ],
      limitations: [
        'No analytics dashboard',
        'No bulk upload',
        'No verification badge',
        'Limited sponsor reach',
      ],
    },
    pro: {
      id: 'pro',
      name: 'Professional',
      description: 'Comprehensive agency tools',
      priceId: {
        monthly: STRIPE_PRICE_IDS.agency.pro.monthly,
        annual: STRIPE_PRICE_IDS.agency.pro.annual,
      },
      monthlyPrice: 299, // AED (approx. $81 USD) - Psychological pricing
      annualPrice: 2988, // AED (~17% discount, approx. $813 USD)
      currency: 'AED',
      features: [
        '25 maid listings',
        '50 message threads',
        '100 sponsor connections',
        'Analytics dashboard',
        '24-hour support response',
        'Direct messaging',
      ],
      popular: true,
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      description: 'Enterprise agency solution',
      priceId: {
        monthly: STRIPE_PRICE_IDS.agency.premium.monthly,
        annual: STRIPE_PRICE_IDS.agency.premium.annual,
      },
      monthlyPrice: 899, // AED (approx. $245 USD) - 3x Pro for clear value separation
      annualPrice: 8988, // AED (~17% discount, approx. $2446 USD)
      currency: 'AED',
      features: [
        'Unlimited maid listings',
        'Unlimited message threads',
        'Unlimited sponsor connections',
        'Advanced analytics dashboard',
        'Bulk upload capabilities',
        'Verification badge',
        '6-hour priority support',
        'Direct messaging',
        'White-label options',
        'API access',
        'Dedicated account manager',
      ],
    },
  },
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get price ID for a specific plan and billing cycle
 */
export const getPriceId = (userType, planId, billingCycle = 'monthly') => {
  if (planId === 'free') return null;

  const plan = STRIPE_PRICE_IDS[userType]?.[planId];
  if (!plan) return null;

  return typeof plan === 'string' ? plan : plan[billingCycle];
};

/**
 * Get plan configuration
 */
export const getPlanConfig = (userType, planId) => {
  return SUBSCRIPTION_PLANS_CONFIG[userType]?.[planId] || null;
};

/**
 * Get all plans for a user type
 */
export const getPlansForUserType = (userType) => {
  return SUBSCRIPTION_PLANS_CONFIG[userType] || {};
};

/**
 * Validate Stripe configuration with enhanced security checks
 */
export const validateStripeConfig = () => {
  const config = STRIPE_CONFIG;
  const errors = [];

  // Validate publishable key
  if (!config.publishableKey) {
    errors.push('CRITICAL: Missing Stripe publishable key - check VITE_STRIPE_PUBLISHABLE_KEY environment variable');
  }

  if (config.publishableKey && !config.publishableKey.startsWith('pk_')) {
    errors.push('CRITICAL: Invalid Stripe publishable key format - must start with "pk_"');
  }

  if (config.publishableKey && config.publishableKey.includes('YOUR_')) {
    errors.push('CRITICAL: Placeholder Stripe key detected - replace with actual key');
  }

  // Security check: warn if test key is used in production
  if (config.publishableKey && config.publishableKey.includes('test') && import.meta.env.PROD) {
    errors.push('WARNING: Using test Stripe key in production environment');
  }

  // Validate price IDs for all plans
  const userTypes = ['maid', 'sponsor', 'agency'];
  const planTypes = ['pro', 'premium'];
  const billingCycles = ['monthly', 'annual'];

  userTypes.forEach(userType => {
    planTypes.forEach(planType => {
      billingCycles.forEach(cycle => {
        const priceId = STRIPE_PRICE_IDS[userType]?.[planType]?.[cycle];
        if (!priceId) {
          const envVar = `VITE_STRIPE_${userType.toUpperCase()}_${planType.toUpperCase()}_${cycle.toUpperCase()}`;
          errors.push(`CRITICAL: Missing Stripe price ID for ${userType} ${planType} ${cycle} - check ${envVar} environment variable`);
        } else if (!priceId.startsWith('price_')) {
          errors.push(`CRITICAL: Invalid Stripe price ID format for ${userType} ${planType} ${cycle} - must start with "price_"`);
        }
      });
    });
  });

  // NOTE: secretKey and webhookSecret validation removed as they should only exist server-side

  return {
    isValid: errors.length === 0,
    errors,
    warnings: errors.filter(e => e.startsWith('WARNING:')),
    critical: errors.filter(e => e.startsWith('CRITICAL:')),
  };
};

/**
 * Format price for display
 * @deprecated Use getConvertedPrice from currencyService instead for dynamic currency conversion
 * This function is kept for backward compatibility but will format in the provided currency
 */
export const formatPrice = (price, currency = 'AED') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Format price with currency conversion
 * This is the new recommended way to format prices
 * @param {number} priceInAED - Price in AED (base currency)
 * @param {string} targetCurrency - Target currency code (optional, auto-detected)
 * @returns {Promise<string>} Formatted price in user's currency
 */
export const formatPriceWithConversion = async (priceInAED, targetCurrency = null) => {
  // Import currencyService dynamically to avoid circular dependencies
  const { getConvertedPrice } = await import('../services/currencyService.js');
  const result = await getConvertedPrice(priceInAED, targetCurrency);
  return result.formatted;
};

/**
 * Calculate annual savings
 */
export const calculateAnnualSavings = (monthlyPrice, annualPrice) => {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - annualPrice;
  const percentage = Math.round((savings / monthlyTotal) * 100);

  return {
    amount: savings,
    percentage,
    monthlyEquivalent: annualPrice / 12,
  };
};

// =============================================
// EXPORT DEFAULT CONFIG
// =============================================

export default {
  STRIPE_PRICE_IDS,
  STRIPE_CONFIG,
  SUBSCRIPTION_PLANS_CONFIG,
  getPriceId,
  getPlanConfig,
  getPlansForUserType,
  validateStripeConfig,
  formatPrice,
  formatPriceWithConversion,
  calculateAnnualSavings,
};
