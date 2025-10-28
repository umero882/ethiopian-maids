/**
 * AuditLogger Port (Interface)
 *
 * Defines the contract for audit logging.
 * Implementations should handle persistent storage of audit events.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class AuditLogger {
  /**
   * Log an audit event
   *
   * @param {Object} event
   * @param {string} event.action - The action performed
   * @param {string} event.userId - The user who performed the action
   * @param {string} event.agencyId - The agency context
   * @param {string} event.resourceId - Optional resource ID affected
   * @param {Object} event.metadata - Additional metadata
   * @param {string} event.error - Optional error message if action failed
   * @param {Date} event.timestamp - When the action occurred
   * @returns {Promise<void>}
   */
  async log(event) {
    throw new Error('Method not implemented: log');
  }

  /**
   * Get audit logs for an agency
   *
   * @param {string} agencyId - The agency ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async getAuditLogs(agencyId, filters = {}) {
    throw new Error('Method not implemented: getAuditLogs');
  }
}
