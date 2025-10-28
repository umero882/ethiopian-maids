/**
 * SupabaseAuditLogger - Infrastructure Adapter
 *
 * Implements AuditLogger port using Supabase database.
 * Stores audit logs in the agency_audit_logs table.
 *
 * @package @ethio-maids/infra-profiles-agency
 */

import { AuditLogger } from '@ethio-maids/app-profiles-agency';

export class SupabaseAuditLogger extends AuditLogger {
  constructor(supabase) {
    super();
    if (!supabase) {
      throw new Error('Supabase client is required');
    }
    this.supabase = supabase;
  }

  /**
   * Log an audit event
   */
  async log(event) {
    try {
      // Map to actual database schema
      const logEntry = {
        action: event.action,
        user_id: event.userId || 'system',
        agency_id: event.agencyId,
        entity_type: event.entityType || 'maid', // Default to 'maid' for maid operations
        entity_id: event.resourceId || null,
        details: {
          ...(event.metadata || {}),
          error: event.error || null,
          timestamp: event.timestamp || new Date()
        },
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null
      };

      const { error } = await this.supabase
        .from('agency_audit_logs')
        .insert([logEntry]);

      if (error) {
        // Don't throw - audit logging should not break the main flow
        console.error('Failed to write audit log:', error.message);
      }

    } catch (error) {
      // Silently fail - audit logging should not break the main flow
      console.error('Audit logger error:', error.message);
    }
  }

  /**
   * Get audit logs for an agency
   */
  async getAuditLogs(agencyId, filters = {}) {
    try {
      let query = this.supabase
        .from('agency_audit_logs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false }); // Use created_at instead of timestamp

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate); // Use created_at
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate); // Use created_at
      }

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to retrieve audit logs:', error.message);
      return [];
    }
  }
}
