/**
 * PasswordReset Entity
 *
 * Represents a password reset request.
 * Enforces security rules around password reset lifecycle.
 */

export class PasswordReset {
  constructor({
    id,
    userId,
    email,
    token,
    expiresAt,
    createdAt = new Date(),
    usedAt = null,
    status = 'pending',
    ipAddress = null,
  }) {
    this.id = id;
    this.userId = userId;
    this.email = email;
    this.token = token;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.usedAt = usedAt;
    this.status = status; // 'pending' | 'used' | 'expired' | 'cancelled'
    this.ipAddress = ipAddress;

    this._domainEvents = [];
  }

  /**
   * Check if reset token is valid
   */
  isValid() {
    if (this.status !== 'pending') {
      return false;
    }

    if (new Date() > this.expiresAt) {
      this.expire();
      return false;
    }

    return true;
  }

  /**
   * Expire the reset token
   */
  expire() {
    if (this.status !== 'pending') {
      throw new Error('Only pending reset tokens can be expired');
    }

    this.status = 'expired';

    this._domainEvents.push({
      type: 'PasswordResetExpired',
      payload: {
        resetId: this.id,
        userId: this.userId,
        email: this.email,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Mark reset token as used
   */
  markAsUsed() {
    if (!this.isValid()) {
      throw new Error('Cannot use invalid reset token');
    }

    this.status = 'used';
    this.usedAt = new Date();

    this._domainEvents.push({
      type: 'PasswordResetUsed',
      payload: {
        resetId: this.id,
        userId: this.userId,
        email: this.email,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Cancel the reset request
   */
  cancel(reason = null) {
    if (this.status !== 'pending') {
      throw new Error('Only pending reset tokens can be cancelled');
    }

    this.status = 'cancelled';

    this._domainEvents.push({
      type: 'PasswordResetCancelled',
      payload: {
        resetId: this.id,
        userId: this.userId,
        reason,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Get domain events and clear
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Check if reset is approaching expiry
   */
  isApproachingExpiry(thresholdMinutes = 10) {
    const now = new Date();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    const timeUntilExpiry = this.expiresAt.getTime() - now.getTime();

    return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs;
  }

  /**
   * Get age in minutes
   */
  getAgeInMinutes() {
    const now = new Date();
    const ageMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(ageMs / (60 * 1000));
  }
}
