/**
 * Salary Value Object
 *
 * Immutable representation of salary with currency and payment period.
 */

export class Salary {
  constructor(props) {
    this._validate(props);

    this.amount = props.amount;
    this.currency = props.currency || 'AED'; // Default to AED (UAE Dirham)
    this.period = props.period || 'monthly'; // monthly, weekly, hourly
  }

  /**
   * Validate props
   */
  _validate(props) {
    if (!props.amount || typeof props.amount !== 'number') {
      throw new Error('Amount is required and must be a number');
    }

    if (props.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const validCurrencies = ['AED', 'SAR', 'USD', 'EUR', 'GBP', 'KWD', 'QAR', 'BHD', 'OMR'];
    if (props.currency && !validCurrencies.includes(props.currency)) {
      throw new Error(`Invalid currency: ${props.currency}`);
    }

    const validPeriods = ['monthly', 'weekly', 'hourly', 'yearly'];
    if (props.period && !validPeriods.includes(props.period)) {
      throw new Error(`Invalid period: ${props.period}`);
    }
  }

  /**
   * Convert to monthly equivalent for comparison
   */
  toMonthlyAmount() {
    switch (this.period) {
      case 'monthly':
        return this.amount;
      case 'weekly':
        return this.amount * 4.33; // Average weeks per month
      case 'hourly':
        return this.amount * 160; // Assuming 40 hours/week
      case 'yearly':
        return this.amount / 12;
      default:
        return this.amount;
    }
  }

  /**
   * Compare with another salary
   * Returns: -1 if less, 0 if equal, 1 if greater
   */
  compareTo(other) {
    if (!(other instanceof Salary)) {
      throw new Error('Can only compare with another Salary object');
    }

    // Convert both to same currency (simplified - in production use exchange rates)
    const thisMonthly = this.toMonthlyAmount();
    const otherMonthly = other.toMonthlyAmount();

    if (thisMonthly < otherMonthly) return -1;
    if (thisMonthly > otherMonthly) return 1;
    return 0;
  }

  /**
   * Check if salary is within range
   */
  isInRange(min, max) {
    const monthly = this.toMonthlyAmount();
    return monthly >= min && monthly <= max;
  }

  /**
   * Format for display
   */
  format() {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this.amount);

    const periodLabel = {
      monthly: 'per month',
      weekly: 'per week',
      hourly: 'per hour',
      yearly: 'per year',
    }[this.period];

    return `${formatted} ${periodLabel}`;
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
      period: this.period,
    };
  }

  /**
   * Value equality
   */
  equals(other) {
    if (!(other instanceof Salary)) return false;

    return this.amount === other.amount &&
           this.currency === other.currency &&
           this.period === other.period;
  }
}
