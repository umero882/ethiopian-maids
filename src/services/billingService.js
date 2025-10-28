import { getStripe } from '@/lib/stripe';
import stripeBillingService from './stripeBillingService';

/**
 * Billing Service - Legacy Wrapper
 *
 * ⚠️ DEPRECATED: This service contains mock implementations and is being phased out.
 *
 * ✅ REAL STRIPE INTEGRATION NOW AVAILABLE:
 * - Use stripeBillingService for all new implementations
 * - Real Stripe price IDs configured in /config/stripeConfig.js
 * - Production-ready webhook handling in /services/stripeWebhookHandler.js
 *
 * This wrapper exists for backward compatibility with existing components.
 * All functions now redirect to real Stripe implementations where possible.
 */
import { createLogger } from '@/utils/logger';
const log = createLogger('BillingService');

export const billingService = {
  /**
   * Create a new subscription for a user
   * @deprecated Use stripeBillingService.createCheckoutSession() instead
   */
  createSubscription: async (userId, userType, planId) => {
    log.warn(
      'billingService.createSubscription is deprecated. Use stripeBillingService.createCheckoutSession() instead.'
    );

    // Redirect to real Stripe service
    return await stripeBillingService.createCheckoutSession(userId, planId);
  },

  /**
   * Update an existing subscription (change plan)
   * @param {string} subscriptionId - Subscription ID
   * @param {string} newPlanId - New plan ID
   * @param {boolean} shouldProrate - Whether to prorate the charges
   * @returns {Promise<Object>} - Updated subscription details
   */
  changePlan: async (subscriptionId, newPlanId, shouldProrate = true) => {
    /* console.log(
      `Changing subscription ${subscriptionId} to plan ${newPlanId} (prorate: ${shouldProrate})`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: subscriptionId,
          planId: newPlanId,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          cancelAtPeriodEnd: false,
          prorationDetails: shouldProrate
            ? {
                prorationDate: new Date().toISOString(),
                creditAmount: Math.floor(Math.random() * 1000) / 100,
              }
            : null,
        });
      }, 1000);
    });
  },

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} cancelAtPeriodEnd - Whether to cancel at period end or immediately
   * @returns {Promise<Object>} - Cancellation details
   */
  cancelSubscription: async (subscriptionId, cancelAtPeriodEnd = true) => {
    /* console.log(
      `Canceling subscription ${subscriptionId} (at period end: ${cancelAtPeriodEnd})`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: subscriptionId,
          status: cancelAtPeriodEnd ? 'active' : 'canceled',
          cancelAtPeriodEnd,
          canceledAt: new Date().toISOString(),
          endDate: cancelAtPeriodEnd
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date().toISOString(),
        });
      }, 1000);
    });
  },

  /**
   * Add a payment method for a customer
   * @param {string} customerId - Customer ID
   * @param {Object} paymentMethodDetails - Details for creating payment method
   * @returns {Promise<Object>} - Created payment method
   */
  addPaymentMethod: async (customerId, paymentMethodDetails) => {

    const _stripe = await getStripe();

    // This would normally use Stripe Elements in production
    // Here we're simulating the response

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `pm_${Math.random().toString(36).substring(2, 15)}`,
          type: 'card',
          card: {
            brand: paymentMethodDetails.brand || 'visa',
            last4: paymentMethodDetails.last4 || '4242',
            expMonth: paymentMethodDetails.expMonth || 12,
            expYear: paymentMethodDetails.expYear || 2025,
          },
          billingDetails: {
            name: paymentMethodDetails.name || 'John Doe',
          },
          isDefault: paymentMethodDetails.isDefault || true,
        });
      }, 1000);
    });
  },

  /**
   * Get payment methods for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} - List of payment methods
   */
  getPaymentMethods: async (customerId) => {

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: `pm_${Math.random().toString(36).substring(2, 15)}`,
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2025,
            },
            billingDetails: {
              name: 'John Doe',
            },
            isDefault: true,
          },
        ]);
      }, 500);
    });
  },

  /**
   * Set default payment method for a customer
   * @param {string} customerId - Customer ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Updated customer
   */
  setDefaultPaymentMethod: async (customerId, paymentMethodId) => {
    /* console.log(
      `Setting default payment method ${paymentMethodId} for customer ${customerId}`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: customerId,
          defaultPaymentMethod: paymentMethodId,
        });
      }, 500);
    });
  },

  /**
   * Remove a payment method
   * @param {string} customerId - Customer ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Removal confirmation
   */
  removePaymentMethod: async (customerId, paymentMethodId) => {
    /* console.log(
      `Removing payment method ${paymentMethodId} for customer ${customerId}`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          removedId: paymentMethodId,
        });
      }, 500);
    });
  },

  /**
   * Get invoices for a customer
   * @param {string} customerId - Customer ID
   * @param {number} limit - Maximum number of invoices to return
   * @returns {Promise<Array>} - List of invoices
   */
  getInvoices: async (customerId, limit = 10) => {
    /* console.log(
      `Getting invoices for customer ${customerId} (limit: ${limit})`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const invoices = [];
        for (let i = 0; i < Math.min(limit, 5); i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);

          invoices.push({
            id: `inv_${Math.random().toString(36).substring(2, 15)}`,
            number: `INV-${10000 + i}`,
            customerId,
            status: i === 0 ? 'paid' : i === 1 ? 'open' : 'paid',
            created: date.toISOString(),
            periodStart: new Date(
              date.getTime() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            periodEnd: date.toISOString(),
            total: i === 0 ? 4999 : i === 1 ? 4999 : 2999,
            currency: 'aed',
            description:
              i === 0
                ? 'Pro Plan Subscription'
                : i === 1
                  ? 'Pro Plan Subscription'
                  : 'Basic Plan Subscription',
            pdf: `https://example.com/invoice-${10000 + i}.pdf`,
          });
        }
        resolve(invoices);
      }, 700);
    });
  },

  /**
   * Calculate tax for an amount based on location
   * @param {string} customerId - Customer ID
   * @param {number} amount - Amount in cents
   * @param {Object} location - Customer location details
   * @param {string} location.country - Country code (e.g., 'AE', 'SA', 'BH')
   * @param {string} [location.state] - State/province (optional)
   * @param {string} [location.city] - City (optional)
   * @returns {Promise<Object>} - Tax calculation details
   */
  calculateTax: async (customerId, amount, location) => {
    /* console.log(
      `Calculating tax for customer ${customerId} (amount: ${amount}, location: ${JSON.stringify(location)})`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple tax calculation based on country
        let taxRate = 0;
        let taxDescription = 'No tax';

        switch (location.country) {
          case 'AE':
            taxRate = 0.05; // 5% VAT in UAE
            taxDescription = 'UAE VAT (5%)';
            break;
          case 'SA':
            taxRate = 0.15; // 15% VAT in Saudi Arabia
            taxDescription = 'Saudi Arabia VAT (15%)';
            break;
          case 'BH':
            taxRate = 0.1; // 10% VAT in Bahrain
            taxDescription = 'Bahrain VAT (10%)';
            break;
          // Add more countries as needed
          default:
            taxRate = 0;
            taxDescription = 'No tax';
        }

        const taxAmount = Math.round(amount * taxRate);

        resolve({
          taxAmount,
          taxRate,
          taxDescription,
          totalWithTax: amount + taxAmount,
        });
      }, 300);
    });
  },

  /**
   * Create a checkout session for subscription payment
   * @deprecated Use stripeBillingService.createCheckoutSession() instead
   */
  createCheckoutSession: async (userId, planId, successUrl, cancelUrl) => {
    console.warn(
      '⚠️ billingService.createCheckoutSession is deprecated. Use stripeBillingService.createCheckoutSession() instead.'
    );

    // Redirect to real Stripe service
    return await stripeBillingService.createCheckoutSession(
      userId,
      planId,
      successUrl,
      cancelUrl
    );
  },

  /**
   * Generate a link to the customer portal
   * @deprecated Use stripeBillingService.createPortalSession() instead
   */
  createPortalSession: async (customerId, returnUrl) => {
    console.warn(
      '⚠️ billingService.createPortalSession is deprecated. Use stripeBillingService.createPortalSession() instead.'
    );

    // Redirect to real Stripe service
    return await stripeBillingService.createPortalSession(
      customerId,
      returnUrl
    );
  },

  /**
   * Handle payment failure and retry
   * @param {string} invoiceId - Invoice ID
   * @param {number} attemptCount - Number of previous attempts
   * @returns {Promise<Object>} - Retry details
   */
  retryFailedPayment: async (invoiceId, attemptCount = 0) => {
    /* console.log(
      `Retrying payment for invoice ${invoiceId} (attempt ${attemptCount + 1})`
    ); */

    // Determine retry delay using exponential backoff
    const retryDelays = [1, 24, 72, 168]; // Hours: 1 hour, 1 day, 3 days, 7 days
    const delayHours =
      retryDelays[Math.min(attemptCount, retryDelays.length - 1)];

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% chance of success on retry

        resolve({
          success,
          invoiceId,
          attemptCount: attemptCount + 1,
          retryAfter: success
            ? null
            : new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString(),
          paymentIntent: success
            ? {
                id: `pi_${Math.random().toString(36).substring(2, 15)}`,
                status: 'succeeded',
              }
            : {
                id: `pi_${Math.random().toString(36).substring(2, 15)}`,
                status: 'requires_payment_method',
                lastPaymentError: {
                  code: 'card_declined',
                  message: 'Your card was declined.',
                },
              },
        });
      }, 1000);
    });
  },

  /**
   * Generate revenue report for a specific period
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @param {string} interval - Report interval (day, week, month)
   * @returns {Promise<Object>} - Revenue report
   */
  generateRevenueReport: async (startDate, endDate, interval = 'month') => {
    /* console.log(
      `Generating revenue report from ${startDate} to ${endDate} (interval: ${interval})`
    ); */

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const data = [];

        let current = new Date(start);
        while (current <= end) {
          data.push({
            date: current.toISOString(),
            revenue: Math.floor(Math.random() * 500000) / 100,
            subscriptions: Math.floor(Math.random() * 100),
            refunds: Math.floor(Math.random() * 10),
            netRevenue: Math.floor(Math.random() * 450000) / 100,
          });

          // Increment date based on interval
          if (interval === 'day') {
            current.setDate(current.getDate() + 1);
          } else if (interval === 'week') {
            current.setDate(current.getDate() + 7);
          } else {
            current.setMonth(current.getMonth() + 1);
          }
        }

        resolve({
          startDate,
          endDate,
          interval,
          data,
          summary: {
            totalRevenue: data.reduce((sum, item) => sum + item.revenue, 0),
            totalSubscriptions: data.reduce(
              (sum, item) => sum + item.subscriptions,
              0
            ),
            totalRefunds: data.reduce((sum, item) => sum + item.refunds, 0),
            totalNetRevenue: data.reduce(
              (sum, item) => sum + item.netRevenue,
              0
            ),
          },
        });
      }, 1200);
    });
  },
};

export default billingService;
