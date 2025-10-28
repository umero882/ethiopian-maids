/**
 * 🛡️ Security Configuration
 * Centralized security configuration and enforcement
 */

import { createLogger } from '@/utils/logger';
import { auditLogger, logSecurity, AUDIT_EVENTS, RISK_LEVELS } from '@/lib/auditLogger';

const log = createLogger('SecurityConfig');

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Authentication settings
  AUTH: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    ACTIVITY_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBERS: true,
    PASSWORD_REQUIRE_SYMBOLS: false,
  },

  // Rate limiting settings
  RATE_LIMITING: {
    GENERAL_API: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    AUTH_ENDPOINTS: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // requests per window
    },
    SMS_VERIFICATION: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // requests per window
    },
    FILE_UPLOAD: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // requests per window
    },
    SEARCH_API: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 30, // requests per window
    },
  },

  // Input validation settings
  INPUT_VALIDATION: {
    MAX_TEXT_LENGTH: 1000,
    MAX_NAME_LENGTH: 50,
    MAX_EMAIL_LENGTH: 255,
    MAX_PHONE_LENGTH: 20,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ],
    FORBIDDEN_FILE_EXTENSIONS: [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.jar',
      '.com',
      '.pif',
      '.vbs',
      '.js',
      '.jse',
      '.ws',
      '.wsf',
    ],
  },

  // Encryption settings
  ENCRYPTION: {
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256,
    IV_LENGTH: 12,
    TAG_LENGTH: 16,
    FIELDS_TO_ENCRYPT: [
      'passport_number',
      'national_id',
      'bank_account',
      'emergency_contact_phone',
      'medical_info',
      'previous_employer_contact',
    ],
  },

  // CSRF protection settings
  CSRF: {
    TOKEN_LENGTH: 32,
    HEADER_NAME: 'X-CSRF-Token',
    FORM_FIELD_NAME: 'csrf_token',
  },

  // Content Security Policy
  CSP: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Only in development
        'https://cdn.jsdelivr.net',
        'https://js.stripe.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.stripe.com',
        'https://api.elevenlabs.io',
      ],
      'media-src': ["'self'", 'blob:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  },

  // Audit logging settings
  AUDIT: {
    ENABLED: true,
    LOG_LEVELS: ['low', 'medium', 'high', 'critical'],
    RETENTION_PERIODS: {
      low: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
      medium: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      high: Infinity, // Keep indefinitely
      critical: Infinity, // Keep indefinitely
    },
    REAL_TIME_ALERTS: {
      high: true,
      critical: true,
    },
  },
};

/**
 * Security enforcement class
 */
class SecurityEnforcer {
  constructor() {
    this.initialized = false;
    this.violationCount = 0;
  }

  /**
   * Initialize security enforcement
   */
  async initialize() {
    try {
      log.info('🛡️ Initializing security enforcement...');

      // Initialize security monitoring
      this.initializeSecurityMonitoring();

      // Set up CSP headers (for server-side)
      this.configureCSP();

      // Initialize audit logging
      if (SECURITY_CONFIG.AUDIT.ENABLED) {
        await this.initializeAuditLogging();
      }

      this.initialized = true;
      log.info('🛡️ Security enforcement initialized successfully');

      // Log initialization
      await logSecurity(AUDIT_EVENTS.SYSTEM_MAINTENANCE, {
        details: { security_initialized: true },
        riskLevel: RISK_LEVELS.LOW,
      });
    } catch (error) {
      log.error('❌ Failed to initialize security enforcement:', error);
      throw error;
    }
  }

  /**
   * Initialize security monitoring
   */
  initializeSecurityMonitoring() {
    // Monitor for suspicious patterns
    this.monitorSecurityViolations();

    // Set up automated threat detection
    this.setupThreatDetection();

    log.info('🔍 Security monitoring initialized');
  }

  /**
   * Configure Content Security Policy
   */
  configureCSP() {
    if (typeof window !== 'undefined') {
      // Client-side CSP enforcement
      this.enforceClientCSP();
    }
  }

  /**
   * Enforce client-side CSP
   */
  enforceClientCSP() {
    // Monitor for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation(event);
    });

    // Inject CSP meta tag if not present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = this.generateCSPString();
      document.head.appendChild(meta);
    }
  }

  /**
   * Generate CSP string from configuration
   */
  generateCSPString() {
    return Object.entries(SECURITY_CONFIG.CSP.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Handle CSP violations
   */
  async handleCSPViolation(event) {
    this.violationCount++;

    const violation = {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      lineNumber: event.lineNumber,
      sourceFile: event.sourceFile,
      timestamp: new Date().toISOString(),
    };

    log.warn('🚨 CSP Violation detected:', violation);

    // Log security event
    await logSecurity(AUDIT_EVENTS.SECURITY_XSS_ATTEMPT, {
      details: {
        violation,
        violation_count: this.violationCount,
      },
      riskLevel: RISK_LEVELS.HIGH,
    });

    // If too many violations, take action
    if (this.violationCount > 5) {
      await this.handleSuspiciousActivity('excessive_csp_violations');
    }
  }

  /**
   * Monitor for security violations
   */
  monitorSecurityViolations() {
    // Override console methods to detect potential XSS attempts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if error indicates potential security issue
      const errorString = args.join(' ').toLowerCase();
      if (
        errorString.includes('script') &&
        (errorString.includes('blocked') || errorString.includes('refused'))
      ) {
        this.handlePotentialXSSAttempt(errorString);
      }
      originalConsoleError.apply(console, args);
    };

    // Monitor for suspicious URL changes
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      history.pushState = (...args) => {
        this.validateURLChange(args[2]);
        originalPushState.apply(history, args);
      };
    }
  }

  /**
   * Set up automated threat detection
   */
  setupThreatDetection() {
    // Monitor for rapid-fire requests (potential DDoS)
    this.setupRequestMonitoring();

    // Monitor for suspicious form submissions
    this.setupFormMonitoring();

    // Monitor for unusual navigation patterns
    this.setupNavigationMonitoring();
  }

  /**
   * Set up request monitoring
   */
  setupRequestMonitoring() {
    const requestCounts = new Map();
    const WINDOW_SIZE = 60 * 1000; // 1 minute
    const MAX_REQUESTS = 50;

    // Intercept fetch requests
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const now = Date.now();
        const count = requestCounts.get('fetch') || { count: 0, window: now };

        // Reset window if needed
        if (now - count.window > WINDOW_SIZE) {
          count.count = 0;
          count.window = now;
        }

        count.count++;
        requestCounts.set('fetch', count);

        // Check for suspicious activity
        if (count.count > MAX_REQUESTS) {
          await this.handleSuspiciousActivity('excessive_requests');
        }

        return originalFetch.apply(window, args);
      };
    }
  }

  /**
   * Set up form monitoring
   */
  setupFormMonitoring() {
    if (typeof document !== 'undefined') {
      document.addEventListener('submit', async (event) => {
        await this.validateFormSubmission(event);
      });
    }
  }

  /**
   * Set up navigation monitoring
   */
  setupNavigationMonitoring() {
    if (typeof window !== 'undefined') {
      let navigationCount = 0;
      const startTime = Date.now();

      window.addEventListener('beforeunload', () => {
        navigationCount++;
        const duration = Date.now() - startTime;

        // If too many navigations in short time, log suspicious activity
        if (navigationCount > 20 && duration < 30000) {
          // 20 navigations in 30 seconds
          this.handleSuspiciousActivity('rapid_navigation');
        }
      });
    }
  }

  /**
   * Validate URL changes for potential attacks
   */
  async validateURLChange(url) {
    if (!url) return;

    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /<script/i,
      /eval\(/i,
      /alert\(/i,
      /document\.cookie/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        await logSecurity(AUDIT_EVENTS.SECURITY_XSS_ATTEMPT, {
          details: {
            url,
            pattern: pattern.source,
            type: 'url_navigation',
          },
          riskLevel: RISK_LEVELS.HIGH,
        });
        break;
      }
    }
  }

  /**
   * Handle potential XSS attempts
   */
  async handlePotentialXSSAttempt(errorString) {
    await logSecurity(AUDIT_EVENTS.SECURITY_XSS_ATTEMPT, {
      details: {
        error: errorString,
        timestamp: new Date().toISOString(),
        type: 'console_error',
      },
      riskLevel: RISK_LEVELS.MEDIUM,
    });
  }

  /**
   * Validate form submissions
   */
  async validateFormSubmission(event) {
    const form = event.target;
    const formData = new FormData(form);

    // Check for CSRF token
    if (!formData.get('csrf_token') && !form.dataset.skipCsrf) {
      event.preventDefault();
      await logSecurity(AUDIT_EVENTS.SECURITY_CSRF_VIOLATION, {
        details: {
          form_action: form.action,
          form_method: form.method,
        },
        riskLevel: RISK_LEVELS.HIGH,
      });
    }

    // Check for suspicious form data
    for (const [key, value] of formData.entries()) {
      if (this.containsSuspiciousContent(value)) {
        await logSecurity(AUDIT_EVENTS.SECURITY_XSS_ATTEMPT, {
          details: {
            field: key,
            value: value.substring(0, 100), // Log first 100 chars only
            type: 'form_submission',
          },
          riskLevel: RISK_LEVELS.MEDIUM,
        });
      }
    }
  }

  /**
   * Check if content contains suspicious patterns
   */
  containsSuspiciousContent(content) {
    if (typeof content !== 'string') return false;

    const suspiciousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /eval\s*\(/gi,
      /alert\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Handle suspicious activity
   */
  async handleSuspiciousActivity(activityType) {
    await logSecurity(AUDIT_EVENTS.SECURITY_SUSPICIOUS_ACTIVITY, {
      details: {
        activity_type: activityType,
        timestamp: new Date().toISOString(),
        user_agent: navigator?.userAgent,
        url: window?.location?.href,
      },
      riskLevel: RISK_LEVELS.HIGH,
    });

    // In production, you might want to:
    // 1. Rate limit the user
    // 2. Require additional verification
    // 3. Alert security team
    // 4. Log out the user

    log.warn(`🚨 Suspicious activity detected: ${activityType}`);
  }

  /**
   * Initialize audit logging
   */
  async initializeAuditLogging() {
    try {
      await auditLogger.initialize();
      log.info('📋 Audit logging initialized');
    } catch (error) {
      log.error('❌ Failed to initialize audit logging:', error);
      // Don't throw - audit logging failure shouldn't break the app
    }
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      initialized: this.initialized,
      violationCount: this.violationCount,
      auditEnabled: SECURITY_CONFIG.AUDIT.ENABLED,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create and export security enforcer instance
export const securityEnforcer = new SecurityEnforcer();

/**
 * Initialize security system
 */
export async function initializeSecurity() {
  try {
    await securityEnforcer.initialize();
    log.info('🛡️ Security system fully initialized');
  } catch (error) {
    log.error('❌ Security initialization failed:', error);
    throw error;
  }
}

/**
 * Security validation utilities
 */
export const SecurityValidation = {
  /**
   * Validate if environment is secure
   */
  validateEnvironment() {
    const issues = [];

    // Check for HTTPS in production
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost'
    ) {
      issues.push('Application should use HTTPS in production');
    }

    // Check for development configurations in production
    if (
      import.meta.env.PROD &&
      SECURITY_CONFIG.CSP.directives['script-src'].includes("'unsafe-inline'")
    ) {
      issues.push("'unsafe-inline' should not be allowed in production CSP");
    }

    return {
      isSecure: issues.length === 0,
      issues,
    };
  },

  /**
   * Validate security configuration
   */
  validateConfiguration() {
    const issues = [];

    // Check authentication settings
    if (SECURITY_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS < 3) {
      issues.push('Maximum login attempts should be at least 3');
    }

    if (SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH < 8) {
      issues.push('Password minimum length should be at least 8');
    }

    // Check rate limiting settings
    if (SECURITY_CONFIG.RATE_LIMITING.GENERAL_API.max > 1000) {
      issues.push('General API rate limit seems too high');
    }

    // Check encryption settings
    if (SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH < 256) {
      issues.push('Encryption key length should be at least 256 bits');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },
};

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSecurity);
  } else {
    initializeSecurity();
  }
}

export default SECURITY_CONFIG;