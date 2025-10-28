import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import {
  STRIPE_CONFIG,
  getPriceId,
  validateStripeConfig,
} from '@/config/stripeConfig';
import { createLogger } from '@/utils/logger';
import paymentIdempotencyService from '@/services/paymentIdempotencyService';
const log = createLogger('StripeBilling');

/**
 * Production Stripe Billing Service
 * Replaces mock billing with real Stripe integration
 */
class StripeBillingService {
  constructor() {
    this.stripePromise = null;
    this.initialized = false;
    this.config = STRIPE_CONFIG;
    this.init();
  }

  async init() {
    try {
      // Validate Stripe configuration
      const validation = validateStripeConfig();

      // Log critical errors but don't expose them to users
      if (validation.critical.length > 0) {
        log.error('CRITICAL Stripe configuration errors:', validation.critical);
        this.initialized = false;
        return;
      }

      if (validation.warnings.length > 0) {
        log.warn('Stripe configuration warnings:', validation.warnings);
      }

      if (!validation.isValid) {
        log.error('Stripe configuration validation failed:', validation.errors);
        this.initialized = false;
        return;
      }

      this.stripePromise = loadStripe(this.config.publishableKey);
      this.initialized = true;
      log.info('Stripe billing service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize Stripe:', error);
      this.initialized = false;
    }
  }

  /**
   * Get Stripe instance
   */
  async getStripe() {
    if (!this.initialized) {
      log.error('Attempting to use uninitialized Stripe service');
      throw new Error('Payment service is temporarily unavailable. Please try again later.');
    }
    return await this.stripePromise;
  }

  /**
   * Create subscription checkout session
   */
  async createCheckoutSession(...args) {
    try {
      // Support both (userId, priceId, successUrl, cancelUrl)
      // and ({ userId, priceId, userEmail, planName, billingCycle, successUrl, cancelUrl })
      let params = {};
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        params = args[0];
      } else {
        const [userId, priceId, successUrl, cancelUrl] = args;
        params = { userId, priceId, successUrl, cancelUrl };
      }

      if (!params.userId || !params.priceId) {
        throw new Error('Missing userId or priceId for checkout session');
      }

      const requestBody = {
        userId: params.userId,
        priceId: params.priceId,
        planName: params.planName,
        userEmail: params.userEmail,
        billingCycle: params.billingCycle,
        userType: params.userType,
        planTier: params.planTier,
        successUrl:
          params.successUrl || `${window.location.origin}/dashboard?success=true`,
        cancelUrl:
          params.cancelUrl || `${window.location.origin}/dashboard?canceled=true`,
      };

      console.log('🔍 stripeBillingService - Request body:', JSON.stringify(requestBody, null, 2));

      // Check current auth session with automatic refresh
      let { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        // Try refreshing session before giving up
        console.log('No active session, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshData?.session) {
          console.error('Session refresh failed:', refreshError);
          throw new Error('No active session found. Please log in again.');
        }

        sessionData = refreshData;
        console.log('Session refreshed successfully');
      }

      if (!sessionData.session.access_token) {
        throw new Error('No access token found in session. Please log in again.');
      }

      // Invoke function - Supabase client automatically includes auth headers
      const response = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: requestBody,
        }
      );



      const { data, error } = response;

      // Try to get the actual error response body
      if (error) {
        console.error('🔍 stripeBillingService - Error object:', JSON.stringify(error, null, 2));
        console.error('🔍 stripeBillingService - Error data:', JSON.stringify(data, null, 2));
        console.error('🔍 stripeBillingService - Error message:', error.message);
        console.error('🔍 stripeBillingService - Error context:', error.context);

        // Try to read the response body if available
        if (error.context && error.context.body) {
          try {
            const errorBody = await error.context.json();
            console.error('🔍 stripeBillingService - Error response body:', errorBody);
          } catch (e) {
            console.error('🔍 stripeBillingService - Could not parse error response body');
          }
        }

        throw error;
      }

      if (!data) {
        console.error('🔍 stripeBillingService - No data returned from Edge Function');
        throw new Error('No data returned from Edge Function');
      }


      // Redirect to Stripe Checkout URL directly
      if (!data.url) {
        throw new Error('No checkout URL returned from Edge Function');
      }

      // Redirect to Stripe Checkout page
      window.location.href = data.url;

      return { success: true, url: data.url };
    } catch (error) {
      log.error('Failed to create checkout session:', error);
      toast({
        title: 'Payment Error',
        description: 'Unable to start checkout process. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(customerId, returnUrl) {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-portal-session',
        {
          body: {
            customerId,
            returnUrl: returnUrl || `${window.location.origin}/dashboard`,
          },
        }
      );

      if (error) throw error;

      // Redirect to customer portal
      window.location.href = data.url;
      return { success: true };
    } catch (error) {
      log.error('Failed to create portal session:', error);
      toast({
        title: 'Portal Error',
        description: 'Unable to access billing portal. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user subscription status
   */
  async getSubscriptionStatus(userId) {
    try {
      console.log('🔎 getSubscriptionStatus called with userId:', userId);

      // Check subscriptions table (created by webhook)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📦 Database query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        log.error('Subscription query error:', error);
        console.error('❌ Subscription query error:', error);
        throw error;
      }

      const result = {
        hasActiveSubscription: !!data,
        subscription: data || null,
        plan: data ? {
          name: data.plan_name,
          type: data.plan_type,
          price: data.amount,
          currency: data.currency,
          billing_period: data.billing_period
        } : null,
      };

      console.log('💳 Subscription status result:', result);

      return result;
    } catch (error) {
      log.error('Failed to get subscription status:', error);
      console.error('❌ Exception in getSubscriptionStatus:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        plan: null,
        error: error.message,
      };
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        plans: data || [],
      };
    } catch (error) {
      console.error('❌ Failed to get subscription plans:', error);
      return {
        success: false,
        plans: [],
        error: error.message,
      };
    }
  }

  /**
   * Check if user can access premium features
   */
  async canAccessPremiumFeatures(userId) {
    const { hasActiveSubscription, plan } =
      await this.getSubscriptionStatus(userId);

    return {
      canAccess: hasActiveSubscription,
      plan: plan,
      features: plan?.features || [],
      limits: plan?.limits || {},
    };
  }

  /**
   * Get usage statistics for current billing period
   */
  async getUsageStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_usage_stats')
        .select('*')
        .eq('user_id', userId)
        .gte(
          'period_start',
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        )
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        usage: data || {
          profile_views: 0,
          contact_requests: 0,
          job_posts: 0,
          messages_sent: 0,
        },
      };
    } catch (error) {
      console.error('❌ Failed to get usage stats:', error);
      return {
        success: false,
        usage: {
          profile_views: 0,
          contact_requests: 0,
          job_posts: 0,
          messages_sent: 0,
        },
        error: error.message,
      };
    }
  }

  /**
   * Track feature usage
   */
  async trackUsage(userId, feature, amount = 1) {
    try {
      const { error } = await supabase.rpc('increment_usage_stat', {
        p_user_id: userId,
        p_feature: feature,
        p_amount: amount,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to track usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has reached usage limits
   */
  async checkUsageLimits(userId, feature) {
    try {
      const [subscriptionResult, usageResult] = await Promise.all([
        this.getSubscriptionStatus(userId),
        this.getUsageStats(userId),
      ]);

      const { plan } = subscriptionResult;
      const { usage } = usageResult;

      if (!plan || !plan.limits) {
        // No active subscription - use free tier limits
        const freeLimits = {
          profile_views: 10,
          contact_requests: 3,
          job_posts: 1,
          messages_sent: 20,
        };

        const currentUsage = usage[feature] || 0;
        const limit = freeLimits[feature] || 0;

        return {
          canUse: currentUsage < limit,
          currentUsage,
          limit,
          remaining: Math.max(0, limit - currentUsage),
          isFreeTier: true,
        };
      }

      // Premium subscription - check plan limits
      const currentUsage = usage[feature] || 0;
      const limit = plan.limits[feature] || Infinity;

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit,
        remaining:
          limit === Infinity ? Infinity : Math.max(0, limit - currentUsage),
        isFreeTier: false,
        planName: plan.name,
      };
    } catch (error) {
      console.error('❌ Failed to check usage limits:', error);
      return {
        canUse: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        error: error.message,
      };
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(sessionId) {
    try {
      const { data, error } = await supabase.functions.invoke(
        'handle-payment-success',
        {
          body: { sessionId },
        }
      );

      if (error) throw error;

      toast({
        title: 'Payment Successful!',
        description: 'Your subscription has been activated.',
        variant: 'default',
      });

      return { success: true, subscription: data };
    } catch (error) {
      console.error('❌ Failed to handle payment success:', error);
      toast({
        title: 'Payment Processing Error',
        description:
          'Payment was successful but there was an issue activating your subscription. Please contact support.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const { data, error } = await supabase.functions.invoke(
        'cancel-subscription',
        {
          body: { subscriptionId },
        }
      );

      if (error) throw error;

      toast({
        title: 'Subscription Canceled',
        description:
          'Your subscription has been canceled and will end at the current billing period.',
        variant: 'default',
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      toast({
        title: 'Cancellation Error',
        description:
          'Unable to cancel subscription. Please try again or contact support.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Purchase credits with idempotency protection
   */
  async purchaseCredits(userId, creditsAmount, context = '') {
    try {
      // Credit pricing: $0.50 per credit (50 cents = 50 USD cents)
      const costUsdCents = creditsAmount * 50;

      const result = await paymentIdempotencyService.purchaseCreditsIdempotent(
        userId,
        creditsAmount,
        costUsdCents,
        context
      );

      if (!result.success) {
        return result;
      }

      if (result.duplicate) {
        return result;
      }

      // Create checkout session for credits
      const stripe = await this.getStripe();
      const { error: stripeError } = await stripe.confirmPayment({
        elements: result.paymentIntent.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?credits_purchased=true`,
        },
      });

      if (stripeError) {
        // Update payment status to failed
        await paymentIdempotencyService.updatePaymentStatus(
          result.idempotencyKey,
          'failed'
        );
        throw stripeError;
      }

      return { success: true, paymentIntent: result.paymentIntent };

    } catch (error) {
      log.error('Failed to purchase credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete credit purchase (called after successful Stripe payment)
   */
  async completeCreditPurchase(idempotencyKey, stripePaymentIntentId) {
    try {
      return await paymentIdempotencyService.completeCreditPurchase(
        idempotencyKey,
        stripePaymentIntentId
      );
    } catch (error) {
      log.error('Failed to complete credit purchase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user credit balance
   */
  async getCreditBalance(userId) {
    try {
      return await paymentIdempotencyService.getCreditBalance(userId);
    } catch (error) {
      log.error('Failed to get credit balance:', error);
      return { success: false, credits: 0, error: error.message };
    }
  }

  /**
   * Charge credits for maid contact
   */
  async chargeContactFee(sponsorId, maidId, contactMessage = '') {
    try {
      return await paymentIdempotencyService.chargeContactFeeIdempotent(
        sponsorId,
        maidId,
        1, // 1 credit per contact
        contactMessage
      );
    } catch (error) {
      log.error('Failed to charge contact fee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, limit = 20, offset = 0) {
    try {
      return await paymentIdempotencyService.getPaymentHistory(userId, limit, offset);
    } catch (error) {
      log.error('Failed to get payment history:', error);
      return { success: false, transactions: [], error: error.message };
    }
  }
}

// Create singleton instance
export const stripeBillingService = new StripeBillingService();
export default stripeBillingService;
