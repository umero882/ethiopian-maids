import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';
import stripeBillingService from '@/services/stripeBillingService';

const log = createLogger('PaymentIdempotency');

/**
 * Payment Idempotency Service
 * Prevents duplicate charges and ensures payment reliability
 */
class PaymentIdempotencyService {
  /**
   * Generate a unique idempotency key for a payment operation
   */
  generateIdempotencyKey(userId, operationType, context = '') {
    const timestamp = Date.now();
    const contextHash = this.hashString(context);
    return `${userId}-${operationType}-${timestamp}-${contextHash}`;
  }

  /**
   * Simple hash function for context
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if payment operation is idempotent (prevents duplicates)
   */
  async ensurePaymentIdempotency(idempotencyKey, userId, operationType, amount, currency = 'USD', metadata = {}) {
    try {
      const { data, error } = await supabase.rpc('ensure_payment_idempotency', {
        p_idempotency_key: idempotencyKey,
        p_user_id: userId,
        p_operation_type: operationType,
        p_amount: amount,
        p_currency: currency,
        p_metadata: metadata
      });

      if (error) throw error;

      const result = data[0];
      return {
        isDuplicate: result.is_duplicate,
        paymentRecord: result.payment_record
      };
    } catch (error) {
      log.error('Failed to ensure payment idempotency:', error);
      throw error;
    }
  }

  /**
   * Update payment status in idempotency system
   */
  async updatePaymentStatus(idempotencyKey, status, stripePaymentIntentId = null, stripeChargeId = null) {
    try {
      const { data, error } = await supabase.rpc('update_payment_status', {
        p_idempotency_key: idempotencyKey,
        p_status: status,
        p_stripe_payment_intent_id: stripePaymentIntentId,
        p_stripe_charge_id: stripeChargeId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update payment status:', error);
      throw error;
    }
  }

  /**
   * Purchase credits with idempotency protection
   */
  async purchaseCreditsIdempotent(userId, creditsAmount, costUsdCents, context = '') {
    const idempotencyKey = this.generateIdempotencyKey(userId, 'credit_purchase', context);

    try {
      // Check for duplicate operation
      const { isDuplicate, paymentRecord } = await this.ensurePaymentIdempotency(
        idempotencyKey,
        userId,
        'credit_purchase',
        costUsdCents,
        'USD',
        { credits_amount: creditsAmount }
      );

      if (isDuplicate) {
        log.info('Duplicate credit purchase detected, returning existing result');

        if (paymentRecord.status === 'succeeded') {
          // Get current credits balance
          const { data: credits } = await supabase
            .from('user_credits')
            .select('credits_available')
            .eq('user_id', userId)
            .single();

          return {
            success: true,
            duplicate: true,
            creditsBalance: credits?.credits_available || 0,
            idempotencyKey
          };
        } else if (paymentRecord.status === 'processing') {
          return {
            success: false,
            duplicate: true,
            processing: true,
            message: 'Payment is still being processed. Please wait.',
            idempotencyKey
          };
        } else {
          return {
            success: false,
            duplicate: true,
            message: 'Previous payment attempt failed. Please try again.',
            idempotencyKey
          };
        }
      }

      // Mark as processing
      await this.updatePaymentStatus(idempotencyKey, 'processing');

      // Create Stripe payment intent
      const paymentIntent = await this.createStripePaymentIntent(
        costUsdCents,
        'usd',
        {
          user_id: userId,
          credits_amount: creditsAmount,
          idempotency_key: idempotencyKey
        }
      );

      if (!paymentIntent.success) {
        await this.updatePaymentStatus(idempotencyKey, 'failed');
        throw new Error(paymentIntent.error || 'Failed to create payment intent');
      }

      // Update with Stripe payment intent ID
      await this.updatePaymentStatus(
        idempotencyKey,
        'processing',
        paymentIntent.paymentIntent.id
      );

      return {
        success: true,
        duplicate: false,
        paymentIntent: paymentIntent.paymentIntent,
        idempotencyKey
      };

    } catch (error) {
      log.error('Failed to purchase credits:', error);

      try {
        await this.updatePaymentStatus(idempotencyKey, 'failed');
      } catch (updateError) {
        log.error('Failed to update payment status to failed:', updateError);
      }

      toast({
        title: 'Credit Purchase Failed',
        description: error.message || 'Unable to process credit purchase. Please try again.',
        variant: 'destructive'
      });

      return {
        success: false,
        duplicate: false,
        error: error.message,
        idempotencyKey
      };
    }
  }

  /**
   * Complete credit purchase after successful Stripe payment
   */
  async completeCreditPurchase(idempotencyKey, stripePaymentIntentId) {
    try {
      // Update status to succeeded
      await this.updatePaymentStatus(
        idempotencyKey,
        'succeeded',
        stripePaymentIntentId
      );

      // Get payment record to extract details
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('payment_idempotency')
        .select('*')
        .eq('key', idempotencyKey)
        .single();

      if (fetchError) throw fetchError;

      // Execute credit purchase with database function
      const { data, error } = await supabase.rpc('purchase_credits_idempotent', {
        p_user_id: paymentRecord.user_id,
        p_credits_amount: paymentRecord.metadata.credits_amount,
        p_cost_usd_cents: paymentRecord.amount,
        p_stripe_payment_intent_id: stripePaymentIntentId,
        p_idempotency_key: idempotencyKey
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        throw new Error('Failed to complete credit purchase in database');
      }

      toast({
        title: 'Credits Purchased Successfully!',
        description: `You now have ${result.credits_balance} credits available.`,
        variant: 'default'
      });

      return {
        success: true,
        creditsBalance: result.credits_balance,
        transactionId: result.transaction_id
      };

    } catch (error) {
      log.error('Failed to complete credit purchase:', error);

      // Try to mark as failed
      try {
        await this.updatePaymentStatus(idempotencyKey, 'failed');
      } catch (updateError) {
        log.error('Failed to update payment status to failed:', updateError);
      }

      throw error;
    }
  }

  /**
   * Charge credits for maid contact with idempotency
   */
  async chargeContactFeeIdempotent(sponsorId, maidId, creditsToCharge = 1, contactMessage = '') {
    const context = `contact-${maidId}-${this.hashString(contactMessage)}`;
    const idempotencyKey = this.generateIdempotencyKey(sponsorId, 'contact_fee', context);

    try {
      const { data, error } = await supabase.rpc('charge_contact_fee_idempotent', {
        p_sponsor_id: sponsorId,
        p_maid_id: maidId,
        p_credits_to_charge: creditsToCharge,
        p_contact_message: contactMessage,
        p_idempotency_key: idempotencyKey
      });

      if (error) throw error;

      const result = data[0];

      if (!result.success) {
        if (result.already_contacted) {
          return {
            success: false,
            alreadyContacted: true,
            creditsRemaining: result.credits_remaining,
            message: 'You have already contacted this maid.'
          };
        } else if (result.insufficient_credits) {
          return {
            success: false,
            insufficientCredits: true,
            creditsRemaining: result.credits_remaining,
            message: `Insufficient credits. You need ${creditsToCharge} credits but only have ${result.credits_remaining}.`
          };
        } else {
          return {
            success: false,
            message: 'Failed to charge contact fee. Please try again.'
          };
        }
      }

      return {
        success: true,
        creditsRemaining: result.credits_remaining,
        message: 'Contact fee charged successfully. Your message has been sent.'
      };

    } catch (error) {
      log.error('Failed to charge contact fee:', error);

      toast({
        title: 'Contact Fee Failed',
        description: error.message || 'Unable to process contact fee. Please try again.',
        variant: 'destructive'
      });

      return {
        success: false,
        error: error.message,
        message: 'Failed to charge contact fee. Please try again.'
      };
    }
  }

  /**
   * Get user credit balance
   */
  async getCreditBalance(userId) {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_available, credits_total_purchased, last_purchase_at')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        success: true,
        credits: data?.credits_available || 0,
        totalPurchased: data?.credits_total_purchased || 0,
        lastPurchaseAt: data?.last_purchase_at
      };
    } catch (error) {
      log.error('Failed to get credit balance:', error);
      return {
        success: false,
        credits: 0,
        error: error.message
      };
    }
  }

  /**
   * Create Stripe payment intent (delegated to existing service)
   */
  async createStripePaymentIntent(amount, currency, metadata) {
    try {
      // Use existing Stripe service to create payment intent
      // This would typically be done via a Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount,
          currency,
          metadata
        }
      });

      if (error) throw error;

      return {
        success: true,
        paymentIntent: data.paymentIntent
      };
    } catch (error) {
      log.error('Failed to create Stripe payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        transactions: data || []
      };
    } catch (error) {
      log.error('Failed to get payment history:', error);
      return {
        success: false,
        transactions: [],
        error: error.message
      };
    }
  }

  /**
   * Cleanup expired idempotency records (should be run periodically)
   */
  async cleanupExpiredRecords() {
    try {
      const { error } = await supabase.rpc('cleanup_expired_idempotency');
      if (error) throw error;

      log.info('Cleaned up expired idempotency records');
      return { success: true };
    } catch (error) {
      log.error('Failed to cleanup expired records:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const paymentIdempotencyService = new PaymentIdempotencyService();
export default paymentIdempotencyService;