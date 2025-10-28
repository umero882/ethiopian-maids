import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';
const log = createLogger('RealtimeService');

/**
 * Real-time Service - Manages Supabase real-time subscriptions
 * Provides live data updates for maid profiles, agency data, and user interactions
 */
class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second

    this.setupConnectionMonitoring();
  }

  /**
   * Setup connection monitoring
   */
  setupConnectionMonitoring() {
    // Monitor Supabase connection status
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        log.info('Real-time service connected');
      } else if (event === 'SIGNED_OUT') {
        this.isConnected = false;
        this.cleanup();
        log.info('Real-time service disconnected');
      }
    });

    // Handle network connectivity
    window.addEventListener('online', () => {
      if (this.isConnected) {
        this.reconnectSubscriptions();
      }
    });

    window.addEventListener('offline', () => {
      log.warn('Real-time service offline');
    });
  }

  /**
   * Subscribe to maid profile changes
   */
  subscribeMaidProfiles(callback, filters = {}) {
    const subscriptionKey = 'maid_profiles';

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    let query = supabase.channel('maid_profiles_channel').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'maid_profiles',
      },
      (payload) => {
        log.debug('Maid profile change:', payload);
        this.handleMaidProfileChange(payload, callback);
      }
    );

    // Apply filters if provided
    if (filters.agentId) {
      query = query.filter('agent_id', 'eq', filters.agentId);
    }

    const subscription = query.subscribe((status) => {
      log.debug('Maid profiles subscription status:', status);
      if (status === 'SUBSCRIBED') {
        log.info('Subscribed to maid profile changes');
      } else if (status === 'CHANNEL_ERROR') {
        log.error('Maid profiles subscription error');
        this.handleSubscriptionError(subscriptionKey);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
    this.listeners.set(subscriptionKey, callback);

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to agency profile changes
   */
  subscribeAgencyProfiles(callback, userId) {
    const subscriptionKey = `agency_profile_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`agency_profile_${userId}_channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agency_profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          log.debug('Agency profile change:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        log.debug('Agency profile subscription status:', status);
        if (status === 'SUBSCRIBED') {
          log.info('Subscribed to agency profile changes');
        } else if (status === 'CHANNEL_ERROR') {
          log.error('Agency profile subscription error');
          this.handleSubscriptionError(subscriptionKey);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);
    this.listeners.set(subscriptionKey, callback);

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to sponsor profile changes
   */
  subscribeSponsorProfiles(callback, userId) {
    const subscriptionKey = `sponsor_profile_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`sponsor_profile_${userId}_channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sponsor_profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          log.debug('Sponsor profile change:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        log.debug('Sponsor profile subscription status:', status);
        if (status === 'SUBSCRIBED') {
          log.info('Subscribed to sponsor profile changes');
        } else if (status === 'CHANNEL_ERROR') {
          log.error('Sponsor profile subscription error');
          this.handleSubscriptionError(subscriptionKey);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);
    this.listeners.set(subscriptionKey, callback);

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to user profile changes
   */
  subscribeUserProfiles(callback, userId) {
    const subscriptionKey = `user_profile_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const subscription = supabase
      .channel(`user_profile_${userId}_channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          log.debug('User profile change:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        log.debug('User profile subscription status:', status);
        if (status === 'SUBSCRIBED') {
          log.info('Subscribed to user profile changes');
        } else if (status === 'CHANNEL_ERROR') {
          log.error('User profile subscription error');
          this.handleSubscriptionError(subscriptionKey);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);
    this.listeners.set(subscriptionKey, callback);

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Handle maid profile changes with proper data transformation
   */
  handleMaidProfileChange(payload, callback) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Transform the data to match expected format
    const transformedPayload = {
      eventType,
      new: newRecord ? this.transformMaidProfile(newRecord) : null,
      old: oldRecord ? this.transformMaidProfile(oldRecord) : null,
    };

    callback(transformedPayload);
  }

  /**
   * Transform maid profile data to match expected format
   */
  transformMaidProfile(profile) {
    return {
      ...profile,
      // Ensure consistent date formatting
      created_at: profile.created_at
        ? new Date(profile.created_at).toISOString()
        : null,
      updated_at: profile.updated_at
        ? new Date(profile.updated_at).toISOString()
        : null,
      // Ensure arrays are properly formatted
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      languages: Array.isArray(profile.languages) ? profile.languages : [],
      // Ensure boolean fields are properly typed
      is_approved: Boolean(profile.is_approved),
      is_available: Boolean(profile.is_available),
    };
  }

  /**
   * Handle subscription errors with exponential backoff
   */
  handleSubscriptionError(subscriptionKey) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      /* console.log(
        `🔄 Attempting to reconnect ${subscriptionKey} in ${delay}ms (attempt ${this.reconnectAttempts})`
      ); */

      setTimeout(() => {
        this.reconnectSubscription(subscriptionKey);
      }, delay);
    } else {
      console.error(
        `❌ Max reconnection attempts reached for ${subscriptionKey}`
      );
    }
  }

  /**
   * Reconnect a specific subscription
   */
  reconnectSubscription(subscriptionKey) {
    const callback = this.listeners.get(subscriptionKey);
    if (callback) {

      // Determine subscription type and reconnect
      if (subscriptionKey === 'maid_profiles') {
        this.subscribeMaidProfiles(callback);
      } else if (subscriptionKey.startsWith('agency_profile_')) {
        const userId = subscriptionKey.replace('agency_profile_', '');
        this.subscribeAgencyProfiles(callback, userId);
      } else if (subscriptionKey.startsWith('sponsor_profile_')) {
        const userId = subscriptionKey.replace('sponsor_profile_', '');
        this.subscribeSponsorProfiles(callback, userId);
      } else if (subscriptionKey.startsWith('user_profile_')) {
        const userId = subscriptionKey.replace('user_profile_', '');
        this.subscribeUserProfiles(callback, userId);
      }
    }
  }

  /**
   * Reconnect all subscriptions
   */
  reconnectSubscriptions() {
    const subscriptionKeys = Array.from(this.subscriptions.keys());

    subscriptionKeys.forEach((key) => {
      this.reconnectSubscription(key);
    });
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      this.listeners.delete(subscriptionKey);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {

    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
    });

    this.subscriptions.clear();
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Get subscription status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();

// Export for testing
export { RealtimeService };
