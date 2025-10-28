/**
 * AuditLogger - Port (Interface)
 *
 * Defines the contract for audit logging.
 * Implementations must provide concrete implementations.
 *
 * @port Infrastructure
 */

export class AuditLogger {
  /**
   * Log an audit event
   * @param {Object} event - The event to log
   * @param {string} event.agencyId - Agency ID
   * @param {string} event.userId - User ID
   * @param {string} event.action - Action performed
   * @param {string} event.entityType - Entity type (e.g., 'dashboard', 'kpi')
   * @param {string} [event.entityId] - Entity ID
   * @param {Object} [event.details] - Additional details
   * @param {Date} [event.timestamp] - Timestamp (defaults to now)
   * @returns {Promise<void>}
   * @throws {Error} If not implemented
   */
  async log(event) {
    throw new Error('AuditLogger.log() must be implemented by adapter');
  }

  /**
   * Get audit logs for an agency
   * @param {string} agencyId - Agency ID
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.action] - Filter by action
   * @param {string} [filters.entityType] - Filter by entity type
   * @param {Date} [filters.startDate] - Filter by start date
   * @param {Date} [filters.endDate] - Filter by end date
   * @param {number} [filters.limit] - Limit results
   * @returns {Promise<Array<Object>>} Audit log entries
   * @throws {Error} If not implemented
   */
  async getAuditLogs(agencyId, filters = {}) {
    throw new Error('AuditLogger.getAuditLogs() must be implemented by adapter');
  }
}
