/**
 * Subscription - Domain Entity
 *
 * Represents a subscription in the system with full business logic.
 * This is a rich domain model following DDD principles.
 *
 * @entity
 */

import { SubscriptionStatus } from '../value-objects/SubscriptionStatus.js';
import { PlanType } from '../value-objects/PlanType.js';

export class Subscription {
  /**
   * @param {Object} props
   * @param {string} props.id - Subscription ID
   * @param {string} props.userId - User ID
   * @param {string} props.planId - Plan ID
   * @param {string} props.planName - Plan name
   * @param {string} props.planType - Plan type (free, pro, premium)
   * @param {number} props.amount - Subscription amount
   * @param {string} props.currency - Currency code
   * @param {string} props.billingPeriod - Billing period (monthly, annual)
   * @param {string} props.status - Subscription status
   * @param {Date} props.startDate - Start date
   * @param {Date} props.endDate - End date
   * @param {Date} [props.trialEndDate] - Trial end date
   * @param {Date} [props.cancelledAt] - Cancellation date
   * @param {string} [props.stripeSubscriptionId] - Stripe subscription ID
   * @param {string} [props.stripeCustomerId] - Stripe customer ID
   * @param {Object} [props.features] - Plan features
   * @param {Object} [props.metadata] - Additional metadata
   * @param {Date} [props.createdAt] - Creation date
   * @param {Date} [props.updatedAt] - Last update date
   */
  constructor(props) {
    this._id = props.id;
    this._userId = props.userId;
    this._planId = props.planId;
    this._planName = props.planName;
    this._planType = new PlanType(props.planType);
    this._amount = props.amount;
    this._currency = props.currency;
    this._billingPeriod = props.billingPeriod;
    this._status = new SubscriptionStatus(props.status);
    this._startDate = new Date(props.startDate);
    this._endDate = new Date(props.endDate);
    this._trialEndDate = props.trialEndDate ? new Date(props.trialEndDate) : null;
    this._cancelledAt = props.cancelledAt ? new Date(props.cancelledAt) : null;
    this._stripeSubscriptionId = props.stripeSubscriptionId || null;
    this._stripeCustomerId = props.stripeCustomerId || null;
    this._features = props.features || {};
    this._metadata = props.metadata || {};
    this._createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this._updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
    this._domainEvents = [];

    // Validate
    this._validate();
  }

  // Getters
  get id() { return this._id; }
  get userId() { return this._userId; }
  get planId() { return this._planId; }
  get planName() { return this._planName; }
  get planType() { return this._planType.value; }
  get amount() { return this._amount; }
  get currency() { return this._currency; }
  get billingPeriod() { return this._billingPeriod; }
  get status() { return this._status.value; }
  get startDate() { return this._startDate; }
  get endDate() { return this._endDate; }
  get trialEndDate() { return this._trialEndDate; }
  get cancelledAt() { return this._cancelledAt; }
  get stripeSubscriptionId() { return this._stripeSubscriptionId; }
  get stripeCustomerId() { return this._stripeCustomerId; }
  get features() { return { ...this._features }; }
  get metadata() { return { ...this._metadata }; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  /**
   * Validation
   */
  _validate() {
    if (!this._userId) {
      throw new Error('Subscription must have a userId');
    }
    if (!this._planType) {
      throw new Error('Subscription must have a planType');
    }
    if (this._amount < 0) {
      throw new Error('Subscription amount cannot be negative');
    }
  }

  /**
   * Business logic: Check if subscription is active
   */
  isActive() {
    return this._status.isActive() && !this.isExpired();
  }

  /**
   * Business logic: Check if subscription is expired
   */
  isExpired() {
    const now = new Date();
    return this._endDate < now;
  }

  /**
   * Business logic: Check if subscription is in trial
   */
  isInTrial() {
    if (!this._trialEndDate) return false;
    const now = new Date();
    return this._trialEndDate > now && this._status.value === 'trial';
  }

  /**
   * Business logic: Get days remaining
   */
  getDaysRemaining() {
    const now = new Date();
    const diffTime = this._endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Business logic: Check if user has feature access
   */
  hasFeature(featureName) {
    return this._features[featureName] === true ||
           (typeof this._features[featureName] === 'number' && this._features[featureName] > 0) ||
           this._features[featureName] === 'Unlimited';
  }

  /**
   * Business logic: Get feature limit
   */
  getFeatureLimit(featureName) {
    return this._features[featureName] || 0;
  }

  /**
   * Business logic: Can upgrade
   */
  canUpgrade() {
    return this._planType.canUpgradeTo() !== null;
  }

  /**
   * Business logic: Can downgrade
   */
  canDowngrade() {
    return this._planType.canDowngradeTo() !== null;
  }

  /**
   * Business logic: Cancel subscription
   */
  cancel() {
    if (this._status.value === 'cancelled') {
      throw new Error('Subscription is already cancelled');
    }

    this._status = new SubscriptionStatus('cancelled');
    this._cancelledAt = new Date();
    this._updatedAt = new Date();

    // Record domain event
    this._domainEvents.push({
      type: 'SubscriptionCancelled',
      aggregateId: this._id,
      userId: this._userId,
      planType: this._planType.value,
      cancelledAt: this._cancelledAt,
      timestamp: new Date()
    });
  }

  /**
   * Business logic: Renew subscription
   */
  renew(newEndDate) {
    if (!this.isActive() && this._status.value !== 'expired') {
      throw new Error('Only active or expired subscriptions can be renewed');
    }

    const oldEndDate = this._endDate;
    this._endDate = new Date(newEndDate);
    this._status = new SubscriptionStatus('active');
    this._updatedAt = new Date();

    // Record domain event
    this._domainEvents.push({
      type: 'SubscriptionRenewed',
      aggregateId: this._id,
      userId: this._userId,
      planType: this._planType.value,
      oldEndDate,
      newEndDate: this._endDate,
      timestamp: new Date()
    });
  }

  /**
   * Business logic: Update status
   */
  updateStatus(newStatus) {
    const oldStatus = this._status.value;
    this._status = new SubscriptionStatus(newStatus);
    this._updatedAt = new Date();

    // Record domain event
    this._domainEvents.push({
      type: 'SubscriptionStatusChanged',
      aggregateId: this._id,
      userId: this._userId,
      oldStatus,
      newStatus,
      timestamp: new Date()
    });
  }

  /**
   * Record domain event for viewing
   */
  recordViewed(viewedBy) {
    this._domainEvents.push({
      type: 'SubscriptionViewed',
      aggregateId: this._id,
      userId: this._userId,
      viewedBy,
      timestamp: new Date()
    });
  }

  /**
   * Pull domain events (for event publishing)
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Convert to DTO (Data Transfer Object)
   */
  toDTO() {
    return {
      id: this._id,
      userId: this._userId,
      planId: this._planId,
      planName: this._planName,
      planType: this._planType.value,
      amount: this._amount,
      currency: this._currency,
      billingPeriod: this._billingPeriod,
      status: this._status.value,
      startDate: this._startDate.toISOString(),
      endDate: this._endDate.toISOString(),
      trialEndDate: this._trialEndDate?.toISOString() || null,
      cancelledAt: this._cancelledAt?.toISOString() || null,
      stripeSubscriptionId: this._stripeSubscriptionId,
      stripeCustomerId: this._stripeCustomerId,
      features: this._features,
      metadata: this._metadata,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      // Computed properties
      isActive: this.isActive(),
      isExpired: this.isExpired(),
      isInTrial: this.isInTrial(),
      daysRemaining: this.getDaysRemaining(),
      canUpgrade: this.canUpgrade(),
      canDowngrade: this.canDowngrade()
    };
  }
}
