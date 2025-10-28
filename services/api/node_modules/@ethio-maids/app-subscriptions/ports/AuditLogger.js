/**
 * AuditLogger - Port (Interface)
 *
 * Defines the contract for audit logging.
 * Implementations (adapters) must provide concrete implementations.
 *
 * @port Infrastructure
 */

export class AuditLogger {
  /**
   * Log an audit event
   * @param {Object} event - Audit event details
   * @param {string} event.userId - User ID
   * @param {string} event.action - Action performed
   * @param {string} event.entityType - Entity type (e.g., 'subscription')
   * @param {string} event.entityId - Entity ID
   * @param {Object} [event.details] - Additional details
   * @param {Date} [event.timestamp] - Event timestamp
   * @returns {Promise<void>}
   * @throws {Error} If not implemented
   */
  async log(event) {
    throw new Error('AuditLogger.log() must be implemented by adapter');
  }
}
