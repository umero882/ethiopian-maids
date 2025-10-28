/**
 * SupabaseAuditLogger - Adapter
 *
 * Concrete implementation of AuditLogger port using Supabase.
 * Part of Infrastructure layer.
 *
 * @adapter
 */

import { AuditLogger } from '@ethio-maids/app-subscriptions';

export class SupabaseAuditLogger extends AuditLogger {
  /**
   * @param {Object} config
   * @param {Object} config.supabaseClient - Supabase client instance
   * @param {Object} [config.logger] - Optional logger
   * @param {boolean} [config.enabled] - Enable/disable audit logging
   */
  constructor({ supabaseClient, logger, enabled = true }) {
    super();

    if (!supabaseClient) {
      throw new Error('supabaseClient is required');
    }

    this.supabase = supabaseClient;
    this.logger = logger || console;
    this.enabled = enabled;
  }

  /**
   * Log an audit event
   */
  async log(event) {
    if (!this.enabled) {
      return;
    }

    try {
      const auditLogEntry = {
        user_id: event.userId,
        action: event.action,
        entity_type: event.entityType,
        entity_id: event.entityId,
        details: event.details || {},
        timestamp: event.timestamp || new Date(),
        created_at: new Date().toISOString()
      };

      // Try to insert into subscription_audit_logs table (if it exists)
      const { error } = await this.supabase
        .from('subscription_audit_logs')
        .insert(auditLogEntry);

      if (error) {
        // If table doesn't exist, just log locally
        this.logger.info('Audit log (table not found):', auditLogEntry);
      }
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      this.logger.error('Error logging audit event:', error);
    }
  }
}
