/**
 * UpgradeSubscription - Use Case (Command)
 *
 * Upgrades a user's subscription to a higher tier.
 * Follows CQRS pattern - this is a Command (write operation).
 *
 * @usecase Command
 */

import { Subscription, PlanType } from '@ethio-maids/domain-subscriptions';

export class UpgradeSubscription {
  /**
   * @param {Object} dependencies
   * @param {SubscriptionRepository} dependencies.subscriptionRepository
   * @param {AuditLogger} dependencies.auditLogger
   */
  constructor({ subscriptionRepository, auditLogger }) {
    if (!subscriptionRepository) {
      throw new Error('subscriptionRepository is required');
    }
    if (!auditLogger) {
      throw new Error('auditLogger is required');
    }

    this.subscriptionRepository = subscriptionRepository;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   * @param {Object} command
   * @param {string} command.userId - The user ID
   * @param {string} command.newPlanType - New plan type (pro, premium)
   * @param {Object} command.planDetails - Plan details (amount, features, etc.)
   * @param {string} [command.stripeSubscriptionId] - Stripe subscription ID
   * @param {string} [command.stripeCustomerId] - Stripe customer ID
   * @param {string} [command.executedBy] - The user executing the command
   * @returns {Promise<Object>} Updated subscription DTO
   * @throws {ValidationError} If validation fails
   * @throws {Error} If operation fails
   */
  async execute(command) {
    // 1. Validate input
    this._validate(command);

    const { userId, newPlanType, planDetails, stripeSubscriptionId, stripeCustomerId, executedBy } = command;

    try {
      // 2. Get current subscription
      const currentSubscriptionData = await this.subscriptionRepository.getActiveSubscription(userId);

      // 3. Verify upgrade is valid
      if (currentSubscriptionData) {
        const currentSubscription = new Subscription(currentSubscriptionData);
        const currentPlan = new PlanType(currentSubscription.planType);
        const newPlan = new PlanType(newPlanType);

        if (!newPlan.isHigherThan(currentPlan)) {
          throw new Error(`Cannot upgrade from ${currentPlan.value} to ${newPlan.value}`);
        }
      }

      // 4. Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      if (planDetails.billingPeriod === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // 5. Prepare subscription data
      const subscriptionData = {
        user_id: userId,
        plan_id: planDetails.planId || `${newPlanType}_${Date.now()}`,
        plan_name: planDetails.planName || newPlanType.charAt(0).toUpperCase() + newPlanType.slice(1),
        plan_type: newPlanType,
        amount: planDetails.amount,
        currency: planDetails.currency || 'AED',
        billing_period: planDetails.billingPeriod || 'monthly',
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        features: planDetails.features || {},
        metadata: {
          upgraded_from: currentSubscriptionData?.plan_type || 'free',
          upgraded_at: new Date().toISOString(),
          ...planDetails.metadata
        }
      };

      // 6. Create/update subscription in repository
      let updatedSubscriptionData;
      if (currentSubscriptionData) {
        updatedSubscriptionData = await this.subscriptionRepository.updateSubscription(
          currentSubscriptionData.id,
          subscriptionData
        );
      } else {
        updatedSubscriptionData = await this.subscriptionRepository.createSubscription(subscriptionData);
      }

      // 7. Create domain entity
      const subscription = new Subscription(updatedSubscriptionData);

      // 8. Publish domain events
      const events = subscription.pullDomainEvents();
      // TODO: Publish events to event bus

      // 9. Audit log
      await this.auditLogger.log({
        userId: executedBy || userId,
        action: 'subscription_upgraded',
        entityType: 'subscription',
        entityId: subscription.id,
        details: {
          oldPlan: currentSubscriptionData?.plan_type || 'free',
          newPlan: newPlanType,
          amount: planDetails.amount,
          billingPeriod: planDetails.billingPeriod
        },
        timestamp: new Date()
      });

      // 10. Return DTO
      return subscription.toDTO();

    } catch (error) {
      // Log error
      await this.auditLogger.log({
        userId: executedBy || userId,
        action: 'subscription_upgrade_failed',
        entityType: 'subscription',
        entityId: userId,
        details: {
          error: error.message,
          newPlanType
        },
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Validation
   */
  _validate(command) {
    if (!command.userId) {
      throw new Error('userId is required');
    }

    if (!command.newPlanType) {
      throw new Error('newPlanType is required');
    }

    if (!command.planDetails) {
      throw new Error('planDetails is required');
    }

    if (typeof command.planDetails.amount !== 'number' || command.planDetails.amount < 0) {
      throw new Error('planDetails.amount must be a non-negative number');
    }

    // Validate plan type
    try {
      new PlanType(command.newPlanType);
    } catch (error) {
      throw new Error(`Invalid plan type: ${command.newPlanType}`);
    }
  }
}
