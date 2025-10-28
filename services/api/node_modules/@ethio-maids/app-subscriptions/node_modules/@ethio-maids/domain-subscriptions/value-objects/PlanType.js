/**
 * PlanType - Value Object
 *
 * Represents a subscription plan type with business rules.
 * Immutable value object following DDD principles.
 *
 * @value-object
 */

export class PlanType {
  static FREE = 'free';
  static PRO = 'pro';
  static PREMIUM = 'premium';

  static VALID_TYPES = [PlanType.FREE, PlanType.PRO, PlanType.PREMIUM];

  static HIERARCHY = {
    free: 0,
    pro: 1,
    premium: 2
  };

  constructor(value) {
    if (!value) {
      throw new Error('Plan type is required');
    }

    const normalizedValue = value.toLowerCase();

    if (!PlanType.VALID_TYPES.includes(normalizedValue)) {
      throw new Error(
        `Invalid plan type: ${value}. Must be one of: ${PlanType.VALID_TYPES.join(', ')}`
      );
    }

    this._value = normalizedValue;
    Object.freeze(this);
  }

  get value() {
    return this._value;
  }

  get level() {
    return PlanType.HIERARCHY[this._value];
  }

  isFree() {
    return this._value === PlanType.FREE;
  }

  isPro() {
    return this._value === PlanType.PRO;
  }

  isPremium() {
    return this._value === PlanType.PREMIUM;
  }

  canUpgradeTo() {
    if (this._value === PlanType.FREE) return PlanType.PRO;
    if (this._value === PlanType.PRO) return PlanType.PREMIUM;
    return null; // Already at highest tier
  }

  canDowngradeTo() {
    if (this._value === PlanType.PREMIUM) return PlanType.PRO;
    if (this._value === PlanType.PRO) return PlanType.FREE;
    return null; // Already at lowest tier
  }

  isHigherThan(other) {
    if (!(other instanceof PlanType)) {
      throw new Error('Comparison must be with another PlanType');
    }
    return this.level > other.level;
  }

  isLowerThan(other) {
    if (!(other instanceof PlanType)) {
      throw new Error('Comparison must be with another PlanType');
    }
    return this.level < other.level;
  }

  equals(other) {
    if (!(other instanceof PlanType)) {
      return false;
    }
    return this._value === other._value;
  }

  toString() {
    return this._value;
  }
}
