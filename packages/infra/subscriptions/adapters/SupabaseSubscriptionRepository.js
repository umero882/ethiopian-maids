/**
 * SupabaseSubscriptionRepository - Adapter
 *
 * Concrete implementation of SubscriptionRepository port using Supabase.
 * Part of Infrastructure layer.
 *
 * @adapter
 */

import { SubscriptionRepository } from '@ethio-maids/app-subscriptions';

export class SupabaseSubscriptionRepository extends SubscriptionRepository {
  /**
   * @param {Object} config
   * @param {Object} config.supabaseClient - Supabase client instance
   * @param {Object} [config.logger] - Optional logger
   */
  constructor({ supabaseClient, logger }) {
    super();

    if (!supabaseClient) {
      throw new Error('supabaseClient is required');
    }

    this.supabase = supabaseClient;
    this.logger = logger || console;
  }

  /**
   * Get active subscription for a user
   */
  async getActiveSubscription(userId) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        this.logger.error('Error fetching active subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in getActiveSubscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .maybeSingle();

      if (error) {
        this.logger.error('Error fetching subscription by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in getSubscriptionById:', error);
      throw error;
    }
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(stripeSubscriptionId) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .maybeSingle();

      if (error) {
        this.logger.error('Error fetching subscription by Stripe ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in getSubscriptionByStripeId:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a user
   */
  async getAllSubscriptions(userId) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Error fetching all subscriptions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Exception in getAllSubscriptions:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in createSubscription:', error);
      throw error;
    }
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        this.logger.error('Error updating subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in updateSubscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const { data, error} = await this.supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        this.logger.error('Error cancelling subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in cancelSubscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription usage and limits
   */
  async getSubscriptionUsage(userId, userType) {
    try {
      // Get active subscription to determine limits
      const subscription = await this.getActiveSubscription(userId);

      // Default limits for free plan
      const defaultLimits = {
        maid: { profileViews: 100, jobApplications: 5, messageThreads: 3 },
        sponsor: { activeJobPostings: 1, candidateSearches: 50, savedCandidates: 10 },
        agency: { maidListings: 3, messageThreads: 5, sponsorConnections: 10 }
      };

      const limits = subscription?.features || defaultLimits[userType] || {};

      // TODO: Fetch actual usage from database
      // For now, return mock data
      const usage = {
        current_period: {},
        limits: limits
      };

      return usage;
    } catch (error) {
      this.logger.error('Exception in getSubscriptionUsage:', error);
      throw error;
    }
  }
}
