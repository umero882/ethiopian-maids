/**
 * GetActiveSubscription - Use Case (Query)
 *
 * Fetches the active subscription for a user.
 * Follows CQRS pattern - this is a Query (read-only operation).
 *
 * @usecase Query
 */

import { Subscription } from '@ethio-maids/domain-subscriptions';

export class GetActiveSubscription {
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
   * @param {Object} query
   * @param {string} query.userId - The user ID
   * @param {string} [query.requestedBy] - The user requesting the data (for audit)
   * @returns {Promise<Object|null>} Subscription DTO or null
   * @throws {ValidationError} If validation fails
   * @throws {Error} If operation fails
   */
  async execute(query) {
    // 1. Validate input
    this._validate(query);

    const { userId, requestedBy } = query;

    try {
      // 2. Fetch subscription data from repository
      const subscriptionData = await this.subscriptionRepository.getActiveSubscription(userId);

      // 3. If no subscription found, return null (user is on free plan)
      if (!subscriptionData) {
        await this.auditLogger.log({
          userId: requestedBy || userId,
          action: 'subscription_viewed',
          entityType: 'subscription',
          entityId: 'none',
          details: { planType: 'free', hasSubscription: false },
          timestamp: new Date()
        });

        return null;
      }

      // 4. Create domain entity
      const subscription = new Subscription(subscriptionData);

      // 5. Record domain event
      if (requestedBy) {
        subscription.recordViewed(requestedBy);
      }

      // 6. Publish domain events (if event bus is available)
      const events = subscription.pullDomainEvents();
      // TODO: Publish events to event bus

      // 7. Audit log
      await this.auditLogger.log({
        userId: requestedBy || userId,
        action: 'subscription_viewed',
        entityType: 'subscription',
        entityId: subscription.id,
        details: {
          planType: subscription.planType,
          status: subscription.status,
          isActive: subscription.isActive(),
          daysRemaining: subscription.getDaysRemaining()
        },
        timestamp: new Date()
      });

      // 8. Return DTO (not the entity itself)
      return subscription.toDTO();

    } catch (error) {
      // Log error
      await this.auditLogger.log({
        userId: requestedBy || userId,
        action: 'subscription_view_failed',
        entityType: 'subscription',
        entityId: userId,
        details: { error: error.message },
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Validation
   */
  _validate(query) {
    if (!query.userId) {
      throw new Error('userId is required');
    }

    if (typeof query.userId !== 'string') {
      throw new Error('userId must be a string');
    }
  }
}
