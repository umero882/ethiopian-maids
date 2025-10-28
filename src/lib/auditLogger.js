/**
 * 🔍 Security Audit Logger & Monitoring System
 * Comprehensive logging and monitoring for security events
 */

import { supabase } from './supabaseClient';
import { getCurrentUser } from './secureAuth';

// =============================================
// AUDIT EVENT TYPES
// =============================================

export const AUDIT_EVENTS = {
  // Authentication Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  REGISTRATION: 'registration',
  PASSWORD_CHANGE: 'password_change',

  // Profile Events
  PROFILE_UPDATE: 'profile_update',
  PROFILE_VIEW: 'profile_view',

  // File Events
  FILE_UPLOAD: 'file_upload',
  FILE_DELETE: 'file_delete',
  FILE_ACCESS: 'file_access',

  // Security Events
  PERMISSION_DENIED: 'permission_denied',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  CSRF_VIOLATION: 'csrf_violation',
  XSS_ATTEMPT: 'xss_attempt',

  // System Events
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// =============================================
// AUDIT LOGGING FUNCTIONS
// =============================================

/**
 * Get client information for audit logging
 * @returns {Object} Client information
 */
function getClientInfo() {
  if (typeof window === 'undefined') {
    return { userAgent: 'Server', ipAddress: null };
  }

  return {
    userAgent: navigator.userAgent,
    ipAddress: null, // Will be filled by server
    url: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log security audit event
 * @param {string} eventType - Type of event
 * @param {Object} eventDetails - Event details
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function logAuditEvent(
  eventType,
  eventDetails = {},
  options = {}
) {
  try {
    const user = getCurrentUser();
    const clientInfo = getClientInfo();

    const auditEntry = {
      user_id: user?.id || null,
      event_type: eventType,
      event_details: {
        ...eventDetails,
        ...clientInfo,
        sessionId: options.sessionId || null,
      },
      ip_address: options.ipAddress || null,
      user_agent: clientInfo.userAgent,
      session_id: options.sessionId || null,
      created_at: new Date().toISOString(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      /* console.log('🔍 Audit Event:', {
        type: eventType,
        user: user?.email || 'anonymous',
        details: eventDetails,
      }); */
    }

    // Store in database (if available)
    try {
      const { error } = await supabase
        .from('security_audit_log')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to store audit event in database:', error);
        // Fallback to localStorage for critical events
        if (isCriticalEvent(eventType)) {
          storeAuditEventLocally(auditEntry);
        }
      }
    } catch (dbError) {
      console.error('Database audit logging failed:', dbError);
      // Fallback to localStorage
      if (isCriticalEvent(eventType)) {
        storeAuditEventLocally(auditEntry);
      }
    }

    // Send to external monitoring service (if configured)
    if (options.sendToMonitoring !== false) {
      await sendToMonitoringService(eventType, auditEntry);
    }
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Even if audit logging fails, we should continue
  }
}

/**
 * Check if event is critical and should be stored locally as backup
 * @param {string} eventType - Event type
 * @returns {boolean} Whether event is critical
 */
function isCriticalEvent(eventType) {
  const criticalEvents = [
    AUDIT_EVENTS.LOGIN_FAILURE,
    AUDIT_EVENTS.PERMISSION_DENIED,
    AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
    AUDIT_EVENTS.CSRF_VIOLATION,
    AUDIT_EVENTS.XSS_ATTEMPT,
    AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
  ];
  return criticalEvents.includes(eventType);
}

/**
 * Store audit event locally as backup
 * @param {Object} auditEntry - Audit entry
 */
function storeAuditEventLocally(auditEntry) {
  try {
    const storageKey = 'security_audit_backup';
    const existing = localStorage.getItem(storageKey);
    const events = existing ? JSON.parse(existing) : [];

    events.push(auditEntry);

    // Keep only last 100 events to prevent storage overflow
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    localStorage.setItem(storageKey, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to store audit event locally:', error);
  }
}

/**
 * Send audit event to external monitoring service
 * @param {string} eventType - Event type
 * @param {Object} auditEntry - Audit entry
 */
async function sendToMonitoringService(eventType, auditEntry) {
  // This would integrate with services like Sentry, LogRocket, etc.
  // For now, we'll just log critical events
  if (isCriticalEvent(eventType)) {
    console.warn('🚨 Critical Security Event:', {
      type: eventType,
      user: auditEntry.user_id,
      timestamp: auditEntry.created_at,
      details: auditEntry.event_details,
    });
  }
}

// =============================================
// CONVENIENCE LOGGING FUNCTIONS
// =============================================

/**
 * Log authentication events
 */
export const auditAuth = {
  loginSuccess: (user, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      ...details,
    }),

  loginFailure: (email, reason, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.LOGIN_FAILURE, { email, reason, ...details }),

  logout: (user, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.LOGOUT, {
      userId: user?.id,
      email: user?.email,
      ...details,
    }),

  registration: (user, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.REGISTRATION, {
      userId: user.id,
      email: user.email,
      ...details,
    }),

  passwordChange: (user, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.PASSWORD_CHANGE, {
      userId: user.id,
      email: user.email,
      ...details,
    }),
};

/**
 * Log profile events
 */
export const auditProfile = {
  update: (profileId, changes, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.PROFILE_UPDATE, {
      profileId,
      changes,
      ...details,
    }),

  view: (profileId, viewerType, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.PROFILE_VIEW, {
      profileId,
      viewerType,
      ...details,
    }),
};

/**
 * Log file events
 */
export const auditFile = {
  upload: (filename, fileType, size, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.FILE_UPLOAD, {
      filename,
      fileType,
      size,
      ...details,
    }),

  delete: (filename, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.FILE_DELETE, { filename, ...details }),

  access: (filename, accessType, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.FILE_ACCESS, {
      filename,
      accessType,
      ...details,
    }),
};

/**
 * Log security events
 */
export const auditSecurity = {
  permissionDenied: (resource, action, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.PERMISSION_DENIED, {
      resource,
      action,
      ...details,
    }),

  rateLimitExceeded: (endpoint, limit, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.RATE_LIMIT_EXCEEDED, {
      endpoint,
      limit,
      ...details,
    }),

  suspiciousActivity: (activityType, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
      activityType,
      ...details,
    }),

  csrfViolation: (endpoint, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.CSRF_VIOLATION, { endpoint, ...details }),

  xssAttempt: (input, location, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.XSS_ATTEMPT, { input, location, ...details }),
};

/**
 * Log system events
 */
export const auditSystem = {
  error: (error, context, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.ERROR, {
      error: error.message,
      stack: error.stack,
      context,
      ...details,
    }),

  warning: (message, context, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.WARNING, { message, context, ...details }),

  info: (message, context, details = {}) =>
    logAuditEvent(AUDIT_EVENTS.INFO, { message, context, ...details }),
};

// =============================================
// MONITORING & ALERTING
// =============================================

/**
 * Monitor for suspicious patterns
 */
export class SecurityMonitor {
  constructor() {
    this.patterns = new Map();
    this.alertThresholds = {
      failedLogins: { count: 5, window: 15 * 60 * 1000 }, // 5 failures in 15 minutes
      suspiciousActivity: { count: 3, window: 60 * 60 * 1000 }, // 3 incidents in 1 hour
      rateLimitHits: { count: 10, window: 60 * 60 * 1000 }, // 10 hits in 1 hour
    };
  }

  /**
   * Check for suspicious patterns
   * @param {string} eventType - Event type
   * @param {Object} eventDetails - Event details
   */
  checkPatterns(eventType, eventDetails) {
    const now = Date.now();
    const userId = eventDetails.userId || 'anonymous';
    const key = `${userId}_${eventType}`;

    if (!this.patterns.has(key)) {
      this.patterns.set(key, []);
    }

    const events = this.patterns.get(key);
    events.push(now);

    // Clean old events
    const threshold = this.alertThresholds[eventType];
    if (threshold) {
      const cutoff = now - threshold.window;
      const recentEvents = events.filter((time) => time > cutoff);
      this.patterns.set(key, recentEvents);

      // Check if threshold exceeded
      if (recentEvents.length >= threshold.count) {
        this.triggerAlert(eventType, userId, recentEvents.length);
      }
    }
  }

  /**
   * Trigger security alert
   * @param {string} eventType - Event type
   * @param {string} userId - User ID
   * @param {number} count - Event count
   */
  triggerAlert(eventType, userId, count) {
    const alert = {
      type: 'SECURITY_ALERT',
      eventType,
      userId,
      count,
      timestamp: new Date().toISOString(),
    };

    console.error('🚨 SECURITY ALERT:', alert);

    // Log the alert as a suspicious activity
    auditSecurity.suspiciousActivity('pattern_detected', {
      originalEventType: eventType,
      userId,
      eventCount: count,
    });
  }
}

// Create global security monitor instance
export const securityMonitor = new SecurityMonitor();

// =============================================
// REACT HOOKS
// =============================================

/**
 * React hook for audit logging
 * @returns {Object} Audit logging utilities
 */
export function useAuditLogger() {
  return {
    logEvent: logAuditEvent,
    auth: auditAuth,
    profile: auditProfile,
    file: auditFile,
    security: auditSecurity,
    system: auditSystem,
  };
}
