/**
 * SubscriptionRepository - Port (Interface)
 *
 * Defines the contract for subscription data access.
 * Implementations (adapters) must provide concrete implementations.
 *
 * @port Infrastructure
 */

export class SubscriptionRepository {
  /**
   * Get active subscription for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} Raw subscription data or null
   * @throws {Error} If not implemented
   */
  async getActiveSubscription(userId) {
    throw new Error('SubscriptionRepository.getActiveSubscription() must be implemented by adapter');
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object|null>} Raw subscription data or null
   * @throws {Error} If not implemented
   */
  async getSubscriptionById(subscriptionId) {
    throw new Error('SubscriptionRepository.getSubscriptionById() must be implemented by adapter');
  }

  /**
   * Get subscription by Stripe subscription ID
   * @param {string} stripeSubscriptionId - The Stripe subscription ID
   * @returns {Promise<Object|null>} Raw subscription data or null
   * @throws {Error} If not implemented
   */
  async getSubscriptionByStripeId(stripeSubscriptionId) {
    throw new Error('SubscriptionRepository.getSubscriptionByStripeId() must be implemented by adapter');
  }

  /**
   * Get all subscriptions for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array<Object>>} Array of raw subscription data
   * @throws {Error} If not implemented
   */
  async getAllSubscriptions(userId) {
    throw new Error('SubscriptionRepository.getAllSubscriptions() must be implemented by adapter');
  }

  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription data
   * @throws {Error} If not implemented
   */
  async createSubscription(subscriptionData) {
    throw new Error('SubscriptionRepository.createSubscription() must be implemented by adapter');
  }

  /**
   * Update an existing subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subscription data
   * @throws {Error} If not implemented
   */
  async updateSubscription(subscriptionId, updates) {
    throw new Error('SubscriptionRepository.updateSubscription() must be implemented by adapter');
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Updated subscription data
   * @throws {Error} If not implemented
   */
  async cancelSubscription(subscriptionId) {
    throw new Error('SubscriptionRepository.cancelSubscription() must be implemented by adapter');
  }

  /**
   * Get subscription usage and limits
   * @param {string} userId - The user ID
   * @param {string} userType - The user type (agency, maid, sponsor)
   * @returns {Promise<Object>} Usage and limits data
   * @throws {Error} If not implemented
   */
  async getSubscriptionUsage(userId, userType) {
    throw new Error('SubscriptionRepository.getSubscriptionUsage() must be implemented by adapter');
  }
}
