/**
 * SupabaseAuditLogger - Implements AuditLogger port
 *
 * Logs audit events to database tables.
 */

import { AuditLogger } from '@ethio-maids/app-identity';

export class SupabaseAuditLogger extends AuditLogger {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event) {
    const { action, userId, resource, result, metadata = {} } = event;

    const { error } = await this.supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action,
        resource,
        result,
        metadata,
        ip_address: metadata.ip,
        user_agent: metadata.userAgent,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failure shouldn't break the flow
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(attempt) {
    const { userId, success, ip, userAgent } = attempt;

    const { error } = await this.supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        metadata: {
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Log PII access
   */
  async logPIIAccess(access) {
    const { userId, accessor, field, reason } = access;

    const { error } = await this.supabase
      .from('pii_access_log')
      .insert({
        user_id: userId,
        accessor_id: accessor,
        field_accessed: field,
        access_reason: reason,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log PII access:', error);
    }
  }
}
