/**
 * AuditLogger Port (Interface)
 *
 * Defines the contract for audit logging.
 */

export class AuditLogger {
  /**
   * Log security event
   * @param {Object} event - { action, userId, resource, result, metadata }
   * @returns {Promise<void>}
   */
  async logSecurityEvent(event) {
    throw new Error('Not implemented');
  }

  /**
   * Log authentication attempt
   * @param {Object} attempt - { userId, success, ip, userAgent }
   * @returns {Promise<void>}
   */
  async logAuthAttempt(attempt) {
    throw new Error('Not implemented');
  }

  /**
   * Log PII access
   * @param {Object} access - { userId, accessor, field, reason }
   * @returns {Promise<void>}
   */
  async logPIIAccess(access) {
    throw new Error('Not implemented');
  }
}
