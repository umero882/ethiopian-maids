import { supabase } from '@/lib/databaseClient';
import { getStripe } from '@/config/stripe';
import { createLogger } from '@/utils/logger';

const log = createLogger('SubscriptionService');

// Stripe Price IDs from environment variables
const STRIPE_PRICE_IDS = {
  maid: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PREMIUM_ANNUAL,
    },
  },
  sponsor: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL,
    },
  },
  agency: {
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

/**
 * Subscription Service
 * Handles all subscription-related database operations and Stripe integration
 */

class SubscriptionService {
  /**
   * Get user's active subscription
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Subscription data or null
   */
  async getActiveSubscription(userId) {
    try {
      console.log('[SubscriptionService] Fetching active subscription for user:', userId);

      // Use maybeSingle() instead of single() to handle 0 or 1 results gracefully
      const queryPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'past_due']) // No trial status
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Subscription query timeout')), 3000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log('[SubscriptionService] Query result - data:', data, 'error:', error);

      if (error) {
        // If no subscription found, return null (user is on free plan)
        if (error.code === 'PGRST116') {
          console.log('[SubscriptionService] No subscription found (PGRST116)');
          return null;
        }
        // Log the full error for debugging
        console.error('[SubscriptionService] Error fetching active subscription:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      if (!data) {
        console.log('[SubscriptionService] No subscription data returned');
        return null;
      }

      console.log('[SubscriptionService] Found subscription:', {
        id: data.id,
        plan_type: data.plan_type,
        status: data.status
      });

      return data;
    } catch (error) {
      // Log but don't throw - graceful degradation
      console.error('[SubscriptionService] Exception fetching active subscription:', error);
      return null;
    }
  }

  /**
   * Get all user subscriptions (including expired/cancelled)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of subscriptions
   */
  async getAllSubscriptions(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const {
        userId,
        planId,
        planName,
        planType,
        amount,
        currency = 'ETB',
        billingPeriod,
        startDate,
        endDate,
        trialEndDate = null,
        stripeSubscriptionId = null,
        stripeCustomerId = null,
        features = {},
        metadata = {},
      } = subscriptionData;

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          plan_name: planName,
          plan_type: planType,
          amount,
          currency,
          billing_period: billingPeriod,
          status: 'active', // No trial period - always active on payment
          start_date: startDate,
          end_date: endDate,
          trial_end_date: trialEndDate,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          features,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription
   */
  async cancelSubscription(subscriptionId, cancelImmediately = false) {
    try {
      log.info('Cancelling subscription:', { subscriptionId, cancelImmediately });

      // Call Edge Function to handle Stripe cancellation
      const response = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId,
          cancelImmediately,
        },
      });

      console.log('Edge Function response:', response);

      const { data, error } = response;

      // Check for function invocation errors
      if (error) {
        console.error('Edge Function invocation error:', {
          message: error.message,
          context: error.context,
          name: error.name,
          status: response.status
        });
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      // Check HTTP status
      if (response.status && response.status !== 200) {
        console.error('Non-200 status:', response.status, 'Data:', data);
        throw new Error(data?.error || `Server returned status ${response.status}`);
      }

      if (!data || !data.success) {
        console.error('Function returned unsuccessful response:', data);
        throw new Error(data?.error || 'Failed to cancel subscription');
      }

      log.info('Subscription cancelled successfully:', data);
      return data.subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);

      // If Edge Function fails, try direct database update as fallback
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', subscriptionId)
          .select()
          .single();

        if (fallbackError) throw fallbackError;

        log.warn('Used fallback cancellation (database only)');
        return fallbackData;
      } catch (fallbackErr) {
        console.error('Fallback cancellation also failed:', fallbackErr);
        throw error; // Throw original error
      }
    }
  }

  /**
   * Upgrade/downgrade subscription plan
   * @param {string} userId - User ID
   * @param {string} newPlanType - New plan type
   * @param {Object} planDetails - Plan details
   * @returns {Promise<Object>} Updated or new subscription
   */
  async changePlan(userId, newPlanType, planDetails) {
    try {
      // Get active subscription
      const activeSubscription = await this.getActiveSubscription(userId);

      // If upgrading from free (no subscription), create new subscription
      if (!activeSubscription) {
        return await this.createSubscription({
          userId,
          ...planDetails,
          planType: newPlanType,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        });
      }

      // If downgrading to free, cancel subscription
      if (newPlanType === 'free') {
        return await this.cancelSubscription(activeSubscription.id);
      }

      // Otherwise, update existing subscription
      return await this.updateSubscription(activeSubscription.id, {
        plan_type: newPlanType,
        plan_name: planDetails.planName,
        amount: planDetails.amount,
        features: planDetails.features,
        metadata: {
          ...activeSubscription.metadata,
          previous_plan: activeSubscription.plan_type,
          changed_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  }

  /**
   * Check if subscription is expired
   * @param {Object} subscription - Subscription object
   * @returns {boolean} True if expired
   */
  isSubscriptionExpired(subscription) {
    if (!subscription || !subscription.end_date) return false;

    const endDate = new Date(subscription.end_date);
    const now = new Date();

    return endDate < now;
  }

  /**
   * Get subscription status
   * @param {Object} subscription - Subscription object
   * @returns {string} Status: 'active', 'trial', 'expired', 'cancelled', 'free'
   */
  getSubscriptionStatus(subscription) {
    if (!subscription) return 'free';

    // Check if expired
    if (this.isSubscriptionExpired(subscription) && subscription.status === 'active') {
      return 'expired';
    }

    return subscription.status;
  }

  /**
   * Calculate days remaining in subscription
   * @param {Object} subscription - Subscription object
   * @returns {number} Days remaining
   */
  getDaysRemaining(subscription) {
    if (!subscription || !subscription.end_date) return 0;

    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get subscription plan type (free, pro, premium)
   * @param {Object} subscription - Subscription object
   * @returns {string} Plan type
   */
  getPlanType(subscription) {
    if (!subscription) return 'free';

    const status = this.getSubscriptionStatus(subscription);
    if (status === 'expired' || status === 'cancelled') return 'free';

    return subscription.plan_type || 'free';
  }

  /**
   * Get Stripe Price ID for a plan
   * @param {string} userType - 'maid', 'sponsor', or 'agency'
   * @param {string} planTier - 'pro' or 'premium'
   * @param {string} billingCycle - 'monthly' or 'annual'
   * @returns {string|null} Stripe Price ID
   */
  getStripePriceId(userType, planTier, billingCycle = 'monthly') {
    try {
      const priceId = STRIPE_PRICE_IDS[userType]?.[planTier]?.[billingCycle];

      if (!priceId) {
        log.error('Price ID not found:', { userType, planTier, billingCycle });
        log.error('Available price IDs:', STRIPE_PRICE_IDS);
        return null;
      }

      log.debug('Retrieved price ID:', priceId);
      return priceId;
    } catch (error) {
      log.error('Error getting price ID:', error);
      return null;
    }
  }

  /**
   * Create Stripe Checkout Session
   * In production, this should call a Supabase Edge Function
   * For now, we'll create a client-side checkout with Stripe.js
   *
   * @param {string} userType - User type ('maid', 'sponsor', 'agency')
   * @param {string} planTier - Plan tier ('pro', 'premium')
   * @param {string} billingCycle - Billing cycle ('monthly', 'annual')
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async createCheckoutSession(userType, planTier, billingCycle = 'monthly') {
    try {
      log.info('Creating Stripe checkout session:', { userType, planTier, billingCycle });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get Stripe price ID
      const priceId = this.getStripePriceId(userType, planTier, billingCycle);
      if (!priceId) {
        throw new Error(
          `Stripe Price ID not configured for ${userType} ${planTier} ${billingCycle}. ` +
          'Please check your .env file.'
        );
      }

      // Get Stripe instance
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized. Please add VITE_STRIPE_PUBLISHABLE_KEY to .env');
      }

      log.info('Calling Supabase Edge Function: create-checkout-session');

      const requestBody = {
        priceId,
        userType,
        planTier,
        billingCycle,
        userId: user.id,
        userEmail: user.email,
        successUrl: `${window.location.origin}/dashboard/${userType}/subscriptions?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/${userType}/subscriptions?canceled=true`,
      };

      log.info('Request body:', requestBody);

      // Call Supabase Edge Function to create checkout session
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: requestBody,
      });


      const { data, error } = response;

      if (error) {
        log.error('Edge Function error:', error);
        log.error('Edge Function error details:', JSON.stringify(error, null, 2));
        console.error('Full Edge Function error:', error);
        console.error('Error context:', error.context);
        console.error('Error message:', error.message);

        // Try to get more details from the error
        if (data) {
          console.error('Error data from Edge Function:', data);
        }

        throw new Error(
          'Failed to create checkout session. ' +
          'Please ensure the Stripe Edge Function is deployed. ' +
          'Error: ' + (error.message || JSON.stringify(error))
        );
      }

      if (!data || !data.sessionId) {
        throw new Error('No session ID returned from Edge Function');
      }

      log.info('Checkout session created:', data.sessionId);

      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (redirectError) {
        log.error('Stripe redirect error:', redirectError);
        throw redirectError;
      }

      return { success: true };
    } catch (error) {
      log.error('Error in createCheckoutSession:', error);
      return {
        success: false,
        error,
      };
    }
  }

  /**
   * Handle successful checkout (called after Stripe redirects back)
   * @param {string} sessionId - Stripe Session ID
   */
  async handleCheckoutSuccess(sessionId) {
    try {
      log.info('Handling checkout success:', sessionId);

      // Call Edge Function to retrieve session and create subscription
      const { data, error } = await supabase.functions.invoke('handle-checkout-success', {
        body: { sessionId },
      });

      if (error) {
        throw error;
      }

      log.info('Checkout success handled:', data);
      return { success: true, data };
    } catch (error) {
      log.error('Error handling checkout success:', error);
      return { success: false, error };
    }
  }

  /**
   * Create Customer Portal session for managing subscription
   * @returns {Promise<{success: boolean, url?: string, error?: Error}>}
   */
  async createPortalSession() {
    try {
      log.info('Creating customer portal session');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Call Edge Function to create portal session
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          userId: user.id,
          returnUrl: `${window.location.origin}/dashboard/subscriptions`,
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.url) {
        throw new Error('No portal URL returned');
      }

      log.info('Portal session created');
      return { success: true, url: data.url };
    } catch (error) {
      log.error('Error creating portal session:', error);
      return { success: false, error };
    }
  }
}

export default new SubscriptionService();
