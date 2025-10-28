/**
 * Subscription Management Service
 * Handles upgrade, downgrade, and cancellation logic for subscriptions
 * Industry-grade implementation with proper validation and error handling
 */

import subscriptionService from './subscriptionService';
import stripeBillingService from './stripeBillingService';
import { supabase } from '@/lib/databaseClient';

class SubscriptionManagementService {
  /**
   * Determine subscription action type
   * @param {string} currentPlan - Current plan (free, pro, premium)
   * @param {string} targetPlan - Target plan (free, pro, premium)
   * @returns {string} Action type: 'upgrade', 'downgrade', 'cancel', 'same', 'subscribe'
   */
  getActionType(currentPlan, targetPlan) {
    if (currentPlan === targetPlan) {
      return 'same';
    }

    const planHierarchy = { free: 0, pro: 1, premium: 2 };

    const currentLevel = planHierarchy[currentPlan?.toLowerCase()] ?? 0;
    const targetLevel = planHierarchy[targetPlan?.toLowerCase()] ?? 0;

    if (currentLevel === 0 && targetLevel > 0) {
      return 'subscribe'; // From free to paid
    }

    if (targetLevel === 0) {
      return 'cancel'; // To free plan
    }

    if (targetLevel > currentLevel) {
      return 'upgrade';
    }

    return 'downgrade';
  }

  /**
   * Check if user can perform action
   * @param {string} actionType - Action type
   * @param {Object} subscriptionDetails - Current subscription details
   * @returns {Object} { allowed: boolean, reason?: string }
   */
  canPerformAction(actionType, subscriptionDetails) {
    // Always allow subscribing from free
    if (actionType === 'subscribe') {
      return { allowed: true };
    }

    // Always allow upgrades
    if (actionType === 'upgrade') {
      return { allowed: true };
    }

    // Check if subscription exists for downgrades/cancels
    if (actionType === 'downgrade' || actionType === 'cancel') {
      if (!subscriptionDetails || !subscriptionDetails.subscriptionId) {
        return {
          allowed: false,
          reason: 'No active subscription found',
        };
      }

      // Check if subscription is already cancelled
      if (subscriptionDetails.status === 'cancelled') {
        return {
          allowed: false,
          reason: 'Subscription is already cancelled',
        };
      }

      return { allowed: true };
    }

    // Same plan - no action needed
    if (actionType === 'same') {
      return {
        allowed: false,
        reason: 'You are already on this plan',
      };
    }

    return { allowed: false, reason: 'Unknown action type' };
  }

  /**
   * Get action button text
   * @param {string} actionType - Action type
   * @param {string} targetPlanName - Target plan name
   * @returns {string} Button text
   */
  getActionButtonText(actionType, targetPlanName) {
    switch (actionType) {
      case 'subscribe':
        return `Subscribe to ${targetPlanName}`;
      case 'upgrade':
        return `Upgrade to ${targetPlanName}`;
      case 'downgrade':
        return `Downgrade to ${targetPlanName}`;
      case 'cancel':
        return 'Switch to Free Plan';
      case 'same':
        return 'Current Plan';
      default:
        return 'Select Plan';
    }
  }

  /**
   * Get action button variant
   * @param {string} actionType - Action type
   * @returns {string} Button variant
   */
  getActionButtonVariant(actionType) {
    switch (actionType) {
      case 'subscribe':
      case 'upgrade':
        return 'default'; // Primary button
      case 'downgrade':
        return 'outline'; // Secondary button
      case 'cancel':
        return 'destructive'; // Danger button
      case 'same':
        return 'ghost'; // Disabled/ghost button
      default:
        return 'default';
    }
  }

  /**
   * Calculate proration for plan changes
   * @param {Object} currentSubscription - Current subscription
   * @param {number} newPlanAmount - New plan amount
   * @returns {Object} Proration details
   */
  calculateProration(currentSubscription, newPlanAmount) {
    if (!currentSubscription || !currentSubscription.end_date) {
      return {
        proratedAmount: newPlanAmount,
        daysRemaining: 0,
        creditAmount: 0,
      };
    }

    const now = new Date();
    const endDate = new Date(currentSubscription.end_date);
    const startDate = new Date(currentSubscription.start_date);

    // Calculate days
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const daysUsed = totalDays - daysRemaining;

    if (daysRemaining <= 0) {
      return {
        proratedAmount: newPlanAmount,
        daysRemaining: 0,
        creditAmount: 0,
      };
    }

    // Calculate credit from current plan
    const currentAmount = parseFloat(currentSubscription.amount) || 0;
    const dailyRate = currentAmount / totalDays;
    const creditAmount = dailyRate * daysRemaining;

    // Calculate prorated amount
    const newDailyRate = newPlanAmount / 30; // Assume 30 days for new billing cycle
    const chargeAmount = newDailyRate * daysRemaining;
    const proratedAmount = Math.max(0, chargeAmount - creditAmount);

    return {
      proratedAmount: Math.round(proratedAmount * 100) / 100,
      daysRemaining,
      creditAmount: Math.round(creditAmount * 100) / 100,
      chargeAmount: Math.round(chargeAmount * 100) / 100,
    };
  }

  /**
   * Handle subscription upgrade
   * @param {Object} params - Upgrade parameters
   * @returns {Promise<Object>} Result
   */
  async handleUpgrade(params) {
    const {
      userId,
      userEmail,
      userType,
      currentPlan,
      targetPlan,
      priceId,
      billingCycle,
    } = params;

    try {
      // Create Stripe checkout session for immediate payment
      const result = await stripeBillingService.createCheckoutSession({
        priceId,
        userId,
        userEmail,
        userType,
        planTier: targetPlan,
        planName: `${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} Plan`,
        billingCycle,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect will happen in the calling component
      return {
        success: true,
        requiresPayment: true,
        checkoutUrl: result.url,
      };
    } catch (error) {
      console.error('Error handling upgrade:', error);
      return {
        success: false,
        error: error.message || 'Failed to process upgrade',
      };
    }
  }

  /**
   * Handle subscription downgrade
   * @param {Object} params - Downgrade parameters
   * @returns {Promise<Object>} Result
   */
  async handleDowngrade(params) {
    const {
      userId,
      userType,
      currentPlan,
      targetPlan,
      subscriptionId,
      stripeSubscriptionId,
    } = params;

    try {
      // For downgrades, schedule the change for end of current billing period
      // This is done via Stripe Customer Portal or Edge Function

      if (stripeSubscriptionId) {
        // Call Edge Function to schedule downgrade in Stripe
        const { data, error } = await supabase.functions.invoke('schedule-plan-change', {
          body: {
            stripeSubscriptionId,
            newPlanType: targetPlan,
            userType,
            userId,
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to schedule downgrade');
        }

        // Update local database to track pending change
        await subscriptionService.updateSubscription(subscriptionId, {
          metadata: {
            pending_plan_change: {
              from: currentPlan,
              to: targetPlan,
              scheduled_at: new Date().toISOString(),
              effective_at: 'end_of_period',
            },
          },
        });

        return {
          success: true,
          message: `Downgrade scheduled. Your plan will change to ${targetPlan} at the end of your current billing period.`,
          scheduledChange: true,
        };
      }

      // If no Stripe subscription (shouldn't happen), update immediately
      await subscriptionService.changePlan(userId, targetPlan, {
        planType: targetPlan,
        planName: `${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} Plan`,
      });

      return {
        success: true,
        message: `Successfully downgraded to ${targetPlan} plan`,
        immediate: true,
      };
    } catch (error) {
      console.error('Error handling downgrade:', error);
      return {
        success: false,
        error: error.message || 'Failed to process downgrade',
      };
    }
  }

  /**
   * Handle subscription cancellation
   * @param {Object} params - Cancellation parameters
   * @returns {Promise<Object>} Result
   */
  async handleCancellation(params) {
    const {
      userId,
      subscriptionId,
      stripeSubscriptionId,
      cancelImmediately = false,
    } = params;

    try {
      console.log('handleCancellation called with params:', {
        userId,
        subscriptionId,
        stripeSubscriptionId,
        cancelImmediately
      });

      if (stripeSubscriptionId) {
        // Cancel via Stripe - use subscriptionId (database ID) not stripeSubscriptionId
        console.log('Calling Edge Function with:', {
          subscriptionId,
          cancelImmediately
        });

        // Get current session to ensure we have a valid auth token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error('No valid session found:', sessionError);
          throw new Error('Authentication required. Please log in again.');
        }

        console.log('Using session token:', session.access_token ? 'Present' : 'Missing');
        console.log('Session user ID:', session.user?.id);
        console.log('Token first 20 chars:', session.access_token?.substring(0, 20));

        // Verify the user is authenticated before calling Edge Function
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        console.log('Current user verification:', {
          userId: currentUser?.id,
          email: currentUser?.email,
          error: userError?.message
        });

        if (userError || !currentUser) {
          console.error('User verification failed:', userError);
          throw new Error('Authentication verification failed. Please log in again.');
        }

        const response = await supabase.functions.invoke('cancel-subscription', {
          body: {
            subscriptionId, // Edge Function expects the database subscription ID
            cancelImmediately,
          },
        });

        console.log('Full Edge Function response:', response);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        console.log('Response error:', response.error);

        const { data, error } = response;

        if (error) {
          console.error('Edge Function error details:', {
            message: error.message,
            name: error.name,
            context: error.context,
            status: response.status
          });

          // Try to read the response body from context
          let errorMessage = error.message || 'Failed to cancel subscription';

          if (error.context && error.context.json) {
            try {
              const errorBody = await error.context.json();
              console.log('Error response body:', errorBody);
              errorMessage = errorBody.error || errorBody.message || errorMessage;
            } catch (e) {
              console.log('Could not parse error response body');
            }
          } else if (error.context && error.context.text) {
            try {
              const errorText = await error.context.text();
              console.log('Error response text:', errorText);
              errorMessage = errorText || errorMessage;
            } catch (e) {
              console.log('Could not read error response text');
            }
          }

          if (data && typeof data === 'object') {
            console.log('Error response data:', data);
            errorMessage = data.error || data.message || errorMessage;
          }

          throw new Error(errorMessage);
        }

        if (!data || !data.success) {
          const errorMsg = data?.error || data?.message || 'Edge Function returned unsuccessful response';
          console.error('Unsuccessful response:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Update local database
        if (cancelImmediately) {
          await subscriptionService.cancelSubscription(subscriptionId);
        } else {
          await subscriptionService.updateSubscription(subscriptionId, {
            metadata: {
              cancel_at_period_end: true,
              cancellation_requested_at: new Date().toISOString(),
            },
          });
        }

        return {
          success: true,
          message: cancelImmediately
            ? 'Subscription cancelled immediately'
            : 'Subscription will be cancelled at the end of your billing period',
          immediate: cancelImmediately,
        };
      }

      // If no Stripe subscription, cancel immediately in database
      await subscriptionService.cancelSubscription(subscriptionId);

      return {
        success: true,
        message: 'Subscription cancelled',
        immediate: true,
      };
    } catch (error) {
      console.error('Error handling cancellation:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription',
      };
    }
  }

  /**
   * Get subscription comparison for decision making
   * @param {Object} currentSubscription - Current subscription
   * @param {Object} targetPlan - Target plan config
   * @param {string} userType - User type
   * @returns {Object} Comparison data
   */
  getSubscriptionComparison(currentSubscription, targetPlan, userType) {
    // This would compare features, pricing, etc.
    // For now, return basic info
    return {
      currentPlan: currentSubscription?.plan_type || 'free',
      targetPlan: targetPlan.id.toLowerCase(),
      priceDifference: targetPlan.monthlyPrice - (currentSubscription?.amount || 0),
      actionType: this.getActionType(
        currentSubscription?.plan_type || 'free',
        targetPlan.id.toLowerCase()
      ),
    };
  }
}

export default new SubscriptionManagementService();
