/**
 * SupabaseAuditLogger - Infrastructure Adapter
 *
 * Implements AuditLogger port using Supabase as the audit log storage.
 * Writes audit events to the agency_audit_logs table.
 *
 * @implements {AuditLogger}
 */

import { AuditLogger } from '@ethio-maids/app-dashboard-agency';

export class SupabaseAuditLogger extends AuditLogger {
  /**
   * @param {Object} dependencies
   * @param {SupabaseClient} dependencies.supabaseClient - Supabase client instance
   * @param {Object} [dependencies.logger] - Optional logger for debugging
   * @param {boolean} [dependencies.enabled=true] - Enable/disable audit logging
   */
  constructor({ supabaseClient, logger = console, enabled = true }) {
    super();

    if (!supabaseClient) {
      throw new Error('supabaseClient is required');
    }

    this.supabase = supabaseClient;
    this.logger = logger;
    this.enabled = enabled;
    this._hasLoggedMissingTable = false; // Flag to prevent console spam
  }

  /**
   * Log an audit event
   * @param {Object} event - Audit event details
   * @param {string} event.agencyId - Agency ID
   * @param {string} event.userId - User who performed the action
   * @param {string} event.action - Action performed (e.g., 'kpis_viewed', 'alerts_viewed')
   * @param {string} event.entityType - Type of entity (e.g., 'dashboard', 'maid', 'job')
   * @param {string} [event.entityId] - ID of the entity affected
   * @param {Object} [event.details] - Additional details about the action
   * @param {Date} [event.timestamp] - When the action occurred (defaults to now)
   * @param {string} [event.ipAddress] - IP address of the user
   * @param {string} [event.userAgent] - User agent string
   * @returns {Promise<void>}
   */
  async log(event) {
    // If logging is disabled, return early
    if (!this.enabled) {
      return;
    }

    try {
      // Validate required fields
      this._validateEvent(event);

      // Prepare audit log entry
      const auditEntry = {
        agency_id: event.agencyId,
        user_id: event.userId,
        action: event.action,
        entity_type: event.entityType,
        entity_id: event.entityId || null,
        details: event.details || {},
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null,
        created_at: event.timestamp || new Date()
      };

      // Insert into audit logs table
      const { error } = await this.supabase
        .from('agency_audit_logs')
        .insert(auditEntry);

      if (error) {
        // Check if table doesn't exist (common during initial setup)
        // PostgreSQL error code 42P01 = undefined_table
        // PostgREST error code PGRST205 = schema cache not found
        if (
          error.code === '42P01' ||
          error.code === 'PGRST205' ||
          (error.message?.includes('relation') && error.message?.includes('does not exist')) ||
          error.message?.includes('Could not find the table')
        ) {
          // Only log once per session to avoid console spam
          if (!this._hasLoggedMissingTable) {
            this._hasLoggedMissingTable = true;
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.logger.warn('⚠️  AUDIT LOGS TABLE NOT FOUND');
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.logger.warn('');
            this.logger.warn('The agency_audit_logs table does not exist in your database.');
            this.logger.warn('');
            this.logger.warn('📋 To enable audit logging:');
            this.logger.warn('   1. Open database/migrations/054_create_agency_audit_logs.sql');
            this.logger.warn('   2. Run it in your Supabase SQL Editor');
            this.logger.warn('   3. Refresh this page');
            this.logger.warn('');
            this.logger.warn('ℹ️  Audit logging is optional - the app works fine without it.');
            this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
          return; // Silently skip - don't break the app
        }

        // Log other errors but don't throw - audit logging should not break the app
        this.logger.error('[SupabaseAuditLogger] Failed to write audit log:', error);
        this.logger.error('[SupabaseAuditLogger] Audit event:', auditEntry);
      }
    } catch (error) {
      // Catch any errors and log them, but don't throw
      // Audit logging failures should not break the application
      this.logger.error('[SupabaseAuditLogger] Error in log():', error);
      this.logger.error('[SupabaseAuditLogger] Event:', event);
    }
  }

  /**
   * Retrieve audit logs for an agency
   * @param {string} agencyId - Agency ID
   * @param {Object} [filters] - Optional filters
   * @param {string} [filters.userId] - Filter by user ID
   * @param {string} [filters.action] - Filter by action type
   * @param {string} [filters.entityType] - Filter by entity type
   * @param {Date} [filters.startDate] - Start date for date range
   * @param {Date} [filters.endDate] - End date for date range
   * @param {number} [filters.limit=100] - Max number of logs to return
   * @param {number} [filters.offset=0] - Offset for pagination
   * @returns {Promise<Array<Object>>} Array of audit log entries
   */
  async getAuditLogs(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('agencyId is required');
      }

      // Build query
      let query = this.supabase
        .from('agency_audit_logs')
        .select(`
          id,
          agency_id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          ip_address,
          user_agent,
          created_at,
          user:profiles!agency_audit_logs_user_id_fkey(name, email)
        `)
        .eq('agency_id', agencyId);

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      // Order by newest first
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error('[SupabaseAuditLogger] Error fetching audit logs:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  /**
   * Get audit log statistics for an agency
   * @param {string} agencyId - Agency ID
   * @param {Object} [options] - Optional parameters
   * @param {Date} [options.startDate] - Start date for date range
   * @param {Date} [options.endDate] - End date for date range
   * @returns {Promise<Object>} Statistics object
   */
  async getAuditStats(agencyId, options = {}) {
    try {
      if (!agencyId) {
        throw new Error('agencyId is required');
      }

      let query = this.supabase
        .from('agency_audit_logs')
        .select('action, entity_type, user_id, created_at')
        .eq('agency_id', agencyId);

      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Calculate statistics
      const stats = {
        totalEvents: data?.length || 0,
        uniqueUsers: new Set(data?.map(log => log.user_id)).size,
        actionCounts: {},
        entityTypeCounts: {},
        recentActivity: data?.slice(0, 10) || []
      };

      // Count actions
      data?.forEach(log => {
        stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;
        stats.entityTypeCounts[log.entity_type] = (stats.entityTypeCounts[log.entity_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      this.logger.error('[SupabaseAuditLogger] Error fetching audit stats:', error);
      throw new Error(`Failed to fetch audit stats: ${error.message}`);
    }
  }

  /**
   * Enable or disable audit logging
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.logger.info(`[SupabaseAuditLogger] Audit logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if audit logging is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  // ========== Private Helper Methods ==========

  /**
   * Validate audit event structure
   * @private
   */
  _validateEvent(event) {
    if (!event) {
      throw new Error('Event object is required');
    }

    const requiredFields = ['agencyId', 'userId', 'action', 'entityType'];
    for (const field of requiredFields) {
      if (!event[field]) {
        throw new Error(`Event.${field} is required`);
      }
    }

    // Validate field types
    if (typeof event.agencyId !== 'string') {
      throw new Error('Event.agencyId must be a string');
    }

    if (typeof event.userId !== 'string') {
      throw new Error('Event.userId must be a string');
    }

    if (typeof event.action !== 'string') {
      throw new Error('Event.action must be a string');
    }

    if (typeof event.entityType !== 'string') {
      throw new Error('Event.entityType must be a string');
    }

    if (event.details && typeof event.details !== 'object') {
      throw new Error('Event.details must be an object');
    }

    if (event.timestamp && !(event.timestamp instanceof Date)) {
      throw new Error('Event.timestamp must be a Date object');
    }
  }
}
