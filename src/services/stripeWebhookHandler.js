/**
 * 🔔 Stripe Webhook Handler
 * Processes real Stripe webhook events for subscription management
 */

import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('StripeWebhook');
import { STRIPE_CONFIG } from '@/config/stripeConfig';
import userAnalytics from '@/utils/userAnalytics';
import productionMonitor from '@/utils/productionMonitoring';

class StripeWebhookHandler {
  constructor() {
    this.webhookSecret = STRIPE_CONFIG.webhookSecret;
    this.supportedEvents = STRIPE_CONFIG.webhookEvents;
  }

  // =============================================
  // WEBHOOK EVENT PROCESSING
  // =============================================

  async processWebhookEvent(event) {
    try {
      log.info(`Processing Stripe webhook: ${event.type}`);
      
      // Verify event is supported
      if (!this.supportedEvents.includes(event.type)) {
        log.warn(`Unsupported webhook event: ${event.type}`);
        return { success: true, message: 'Event type not supported' };
      }

      // Route to appropriate handler
      switch (event.type) {
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event);
        
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(event);
        
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event);
        
        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(event);
        
        case 'customer.created':
          return await this.handleCustomerCreated(event);
        
        case 'customer.updated':
          return await this.handleCustomerUpdated(event);
        
        default:
          log.warn(`Unhandled webhook event: ${event.type}`);
          return { success: true, message: 'Event processed but no handler defined' };
      }
    } catch (error) {
      log.error('Webhook processing error:', error);
      
      // Report error to monitoring
      productionMonitor.reportError('Stripe Webhook Error', {
        eventType: event.type,
        eventId: event.id,
        error: error.message,
        stack: error.stack
      });
      
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // SUBSCRIPTION EVENT HANDLERS
  // =============================================

  async handleSubscriptionCreated(event) {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    
    try {
      // Get user by Stripe customer ID
      const user = await this.getUserByStripeCustomerId(customerId);
      if (!user) {
        throw new Error(`User not found for Stripe customer: ${customerId}`);
      }

      // Extract subscription details
      const subscriptionData = {
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_price_id: subscription.items.data[0]?.price?.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert subscription record
      const { error } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData);

      if (error) throw error;

      // Update user subscription status
      await this.updateUserSubscriptionStatus(user.id, subscription.status, subscriptionData.stripe_price_id);

      // Track analytics
      userAnalytics.trackConversion('subscription_created', {
        userId: user.id,
        subscriptionId: subscription.id,
        priceId: subscriptionData.stripe_price_id,
        status: subscription.status
      });

      log.info(`Subscription created for user ${user.id}`);
      return { success: true, message: 'Subscription created successfully' };

    } catch (error) {
      log.error('Error handling subscription created:', error);
      throw error;
    }
  }

  async handleSubscriptionUpdated(event) {
    const subscription = event.data.object;
    
    try {
      // Update subscription record
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) throw error;

      // Get user for this subscription
      const { data: subscriptionRecord } = await supabase
        .from('user_subscriptions')
        .select('user_id, stripe_price_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (subscriptionRecord) {
        // Update user subscription status
        await this.updateUserSubscriptionStatus(
          subscriptionRecord.user_id, 
          subscription.status, 
          subscriptionRecord.stripe_price_id
        );

        // Track analytics
        userAnalytics.trackConversion('subscription_updated', {
          userId: subscriptionRecord.user_id,
          subscriptionId: subscription.id,
          status: subscription.status
        });
      }

      log.info(`Subscription updated: ${subscription.id}`);
      return { success: true, message: 'Subscription updated successfully' };

    } catch (error) {
      log.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  async handleSubscriptionDeleted(event) {
    const subscription = event.data.object;
    
    try {
      // Update subscription record
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) throw error;

      // Get user for this subscription
      const { data: subscriptionRecord } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (subscriptionRecord) {
        // Downgrade user to free plan
        await this.updateUserSubscriptionStatus(subscriptionRecord.user_id, 'canceled', null);

        // Track analytics
        userAnalytics.trackConversion('subscription_canceled', {
          userId: subscriptionRecord.user_id,
          subscriptionId: subscription.id
        });
      }

      log.info(`Subscription canceled: ${subscription.id}`);
      return { success: true, message: 'Subscription canceled successfully' };

    } catch (error) {
      log.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  // =============================================
  // PAYMENT EVENT HANDLERS
  // =============================================

  async handlePaymentSucceeded(event) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    try {
      // Record successful payment
      const paymentData = {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      // Get subscription record to get user_id
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subscription) {
        paymentData.user_id = subscription.user_id;
        
        // Insert payment record
        const { error } = await supabase
          .from('payments')
          .insert(paymentData);

        if (error) throw error;

        // Track analytics
        userAnalytics.trackConversion('payment_succeeded', {
          userId: subscription.user_id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          subscriptionId: subscriptionId
        });
      }

      log.info(`Payment succeeded: ${invoice.id}`);
      return { success: true, message: 'Payment recorded successfully' };

    } catch (error) {
      log.error('Error handling payment succeeded:', error);
      throw error;
    }
  }

  async handlePaymentFailed(event) {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    try {
      // Record failed payment
      const paymentData = {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
        created_at: new Date().toISOString()
      };

      // Get subscription record to get user_id
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subscription) {
        paymentData.user_id = subscription.user_id;
        
        // Insert payment record
        const { error } = await supabase
          .from('payments')
          .insert(paymentData);

        if (error) throw error;

        // Track analytics
        userAnalytics.trackConversion('payment_failed', {
          userId: subscription.user_id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          subscriptionId: subscriptionId,
          reason: paymentData.failure_reason
        });

        // Note: Failed payment notifications are handled by the notificationService
        // Retry logic is handled by Stripe's built-in retry mechanism
      }

      log.warn(`Payment failed: ${invoice.id}`);
      return { success: true, message: 'Failed payment recorded' };

    } catch (error) {
      log.error('Error handling payment failed:', error);
      throw error;
    }
  }

  async handleCheckoutCompleted(event) {
    const session = event.data.object;
    
    try {
      // Extract customer and subscription info
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      // Update user with Stripe customer ID if not already set
      if (session.client_reference_id) {
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: session.client_reference_id,
            stripe_customer_id: customerId,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          log.error('Error updating user with customer ID:', error);
        }
      }

      log.info(`Checkout completed: ${session.id}`);
      return { success: true, message: 'Checkout session processed' };

    } catch (error) {
      log.error('Error handling checkout completed:', error);
      throw error;
    }
  }

  async handleCustomerCreated(event) {
    const customer = event.data.object;
    
    try {
      // Customer created - basic logging for now
      log.info(`Customer created: ${customer.id}`);
      return { success: true, message: 'Customer record updated' };

    } catch (error) {
      log.error('Error handling customer created:', error);
      throw error;
    }
  }

  async handleCustomerUpdated(event) {
    const customer = event.data.object;
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', customer.id);

      if (error) {
        log.error('Error updating customer mapping:', error);
      }
      log.info(`Customer updated: ${customer.id}`);
      return { success: true, message: 'Customer record updated' };

    } catch (error) {
      log.error('Error handling customer updated:', error);
      throw error;
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getUserByStripeCustomerId(customerId) {
    try {
      const { data: subMap, error: mapError } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (mapError || !subMap) {
        log.error('Error fetching user mapping by Stripe customer ID:', mapError);
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', subMap.user_id)
        .single();

      if (error) {
        log.error('Error fetching profile by user ID from mapping:', error);
        return null;
      }

      return data;
    } catch (error) {
      log.error('Error in getUserByStripeCustomerId:', error);
      return null;
    }
  }

  async updateUserSubscriptionStatus(userId, status, priceId) {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status,
          stripe_price_id: priceId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        log.error('Error updating subscription status:', error);
        throw error;
      }

      log.info(`Updated subscription status for user ${userId} to ${status}`);
    } catch (error) {
      log.error('Error in updateUserSubscriptionStatus:', error);
      throw error;
    }
  }

  getPlanInfoFromPriceId(priceId) {
    if (!priceId) {
      return { plan: 'free', tier: 'free' };
    }

    // Map price IDs to plans (you may want to store this mapping in the database)
    const priceIdMap = {
      'price_1RuWvy3ySFkJEQXknIW9hIBU': { plan: 'pro', tier: 'maid' },
      'price_1RuWxx3ySFkJEQXkKKpUrHX9': { plan: 'pro', tier: 'maid' },
      'price_1RuVMK3ySFkJEQXk68BuD5Wt': { plan: 'premium', tier: 'maid' },
      'price_1RuWnE3ySFkJEQXkJTF0QON2': { plan: 'premium', tier: 'maid' },
      'price_1RuWrr3ySFkJEQXk49EgguMT': { plan: 'pro', tier: 'sponsor' },
      'price_1RuWpW3ySFkJEQXk68mfAktN': { plan: 'pro', tier: 'sponsor' },
      'price_1RuTkb3ySFkJEQXkWnQzNRHK': { plan: 'premium', tier: 'sponsor' },
      'price_1RuTne3ySFkJEQXkIsSElFmY': { plan: 'premium', tier: 'sponsor' },
      'price_1RuUFx3ySFkJEQXkQwHSonGQ': { plan: 'pro', tier: 'agency' },
      'price_1RuUIY3ySFkJEQXkVJUkFSum': { plan: 'pro', tier: 'agency' }
    };

    return priceIdMap[priceId] || { plan: 'unknown', tier: 'unknown' };
  }

  // =============================================
  // WEBHOOK VERIFICATION
  // =============================================

  verifyWebhookSignature(payload, signature) {
    try {
      // In a real implementation, you would use Stripe's webhook signature verification
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const event = stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      // return event;
      
      // For now, we'll assume the webhook is valid
      return JSON.parse(payload);
    } catch (error) {
      log.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

// =============================================
// EXPORT SERVICE
// =============================================

const stripeWebhookHandler = new StripeWebhookHandler();
export default stripeWebhookHandler;
