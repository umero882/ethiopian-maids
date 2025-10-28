/**
 * Session Entity
 *
 * Represents an authenticated user session.
 * Tracks session lifecycle and security.
 */

export class Session {
  constructor({
    id,
    userId,
    token,
    refreshToken = null,
    expiresAt,
    createdAt = new Date(),
    lastActivityAt = new Date(),
    ipAddress = null,
    userAgent = null,
    status = 'active',
  }) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.lastActivityAt = lastActivityAt;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.status = status; // 'active' | 'expired' | 'revoked'

    this._domainEvents = [];
  }

  /**
   * Check if session is valid
   */
  isValid() {
    if (this.status !== 'active') {
      return false;
    }

    if (new Date() > this.expiresAt) {
      this.expire();
      return false;
    }

    return true;
  }

  /**
   * Expire the session
   */
  expire() {
    if (this.status === 'revoked') {
      throw new Error('Cannot expire revoked session');
    }

    this.status = 'expired';

    this._domainEvents.push({
      type: 'SessionExpired',
      payload: { sessionId: this.id, userId: this.userId },
      occurredAt: new Date(),
    });
  }

  /**
   * Revoke the session (logout, security event)
   */
  revoke(reason = null) {
    if (this.status === 'revoked') {
      throw new Error('Session already revoked');
    }

    this.status = 'revoked';

    this._domainEvents.push({
      type: 'SessionRevoked',
      payload: {
        sessionId: this.id,
        userId: this.userId,
        reason,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    if (!this.isValid()) {
      throw new Error('Cannot update activity of invalid session');
    }

    this.lastActivityAt = new Date();
  }

  /**
   * Refresh the session with new token and expiry
   */
  refresh(newToken, newExpiresAt, newRefreshToken = null) {
    if (!this.isValid()) {
      throw new Error('Cannot refresh invalid session');
    }

    this.token = newToken;
    this.expiresAt = newExpiresAt;

    if (newRefreshToken) {
      this.refreshToken = newRefreshToken;
    }

    this.lastActivityAt = new Date();

    this._domainEvents.push({
      type: 'SessionRefreshed',
      payload: { sessionId: this.id, userId: this.userId },
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
   * Check if session is approaching expiry
   */
  isApproachingExpiry(thresholdMinutes = 5) {
    const now = new Date();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    const timeUntilExpiry = this.expiresAt.getTime() - now.getTime();

    return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs;
  }

  /**
   * Get session duration in milliseconds
   */
  getDuration() {
    return this.lastActivityAt.getTime() - this.createdAt.getTime();
  }
}
