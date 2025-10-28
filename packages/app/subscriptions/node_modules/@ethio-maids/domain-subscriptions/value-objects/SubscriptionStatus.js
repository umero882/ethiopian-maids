/**
 * SubscriptionStatus - Value Object
 *
 * Represents the status of a subscription with validation.
 * Immutable value object following DDD principles.
 *
 * @value-object
 */

export class SubscriptionStatus {
  static VALID_STATUSES = ['active', 'trial', 'past_due', 'cancelled', 'expired', 'incomplete'];

  constructor(value) {
    if (!value) {
      throw new Error('Subscription status is required');
    }

    const normalizedValue = value.toLowerCase();

    if (!SubscriptionStatus.VALID_STATUSES.includes(normalizedValue)) {
      throw new Error(
        `Invalid subscription status: ${value}. Must be one of: ${SubscriptionStatus.VALID_STATUSES.join(', ')}`
      );
    }

    this._value = normalizedValue;
    Object.freeze(this);
  }

  get value() {
    return this._value;
  }

  isActive() {
    return this._value === 'active' || this._value === 'trial';
  }

  isCancelled() {
    return this._value === 'cancelled';
  }

  isExpired() {
    return this._value === 'expired';
  }

  isPastDue() {
    return this._value === 'past_due';
  }

  equals(other) {
    if (!(other instanceof SubscriptionStatus)) {
      return false;
    }
    return this._value === other._value;
  }

  toString() {
    return this._value;
  }
}
