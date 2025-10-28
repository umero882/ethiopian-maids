/**
 * 🛡️ Simplified Security Configuration
 * Essential security settings without over-engineering
 */

import { createLogger } from '@/utils/logger';

const log = createLogger('Security');

/**
 * Essential security configuration
 */
export const SECURITY_CONFIG = {
  // Authentication settings
  AUTH: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    PASSWORD_MIN_LENGTH: 8,
    REQUIRE_STRONG_PASSWORD: true,
  },

  // Rate limiting (handled by backend/CDN)
  RATE_LIMITING: {
    ENABLED: true,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },

  // File upload validation
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    FORBIDDEN_EXTENSIONS: ['.exe', '.bat', '.cmd', '.scr', '.js'],
  },

  // Content Security Policy (basic)
  CSP: {
    ENABLED: process.env.NODE_ENV === 'production',
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", 'https://js.stripe.com'],
    STYLE_SRC: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    IMG_SRC: ["'self'", 'data:', 'https:'],
    CONNECT_SRC: ["'self'", 'https://*.supabase.co', 'https://api.stripe.com'],
  },

  // Input validation limits
  VALIDATION: {
    MAX_TEXT_LENGTH: 1000,
    MAX_NAME_LENGTH: 50,
    MAX_EMAIL_LENGTH: 255,
  },
};

/**
 * Simple security utilities
 */
export class SecurityUtils {
  /**
   * Validate password strength
   */
  static validatePassword(password) {
    if (!password || password.length < SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH) {
      return { valid: false, message: `Password must be at least ${SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH} characters` };
    }

    if (SECURITY_CONFIG.AUTH.REQUIRE_STRONG_PASSWORD) {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);

      if (!hasUppercase || !hasLowercase || !hasNumbers) {
        return {
          valid: false,
          message: 'Password must contain uppercase, lowercase, and numbers'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate file upload
   */
  static validateFile(file) {
    // Check file size
    if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
      return {
        valid: false,
        message: `File size must be less than ${SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: 'File type not allowed. Only images and PDFs are accepted.'
      };
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (SECURITY_CONFIG.FILE_UPLOAD.FORBIDDEN_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        message: 'File extension not allowed for security reasons.'
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize text input (basic)
   */
  static sanitizeText(text) {
    if (!text) return '';

    // Remove potential XSS patterns
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<.*?>/g, '')
      .trim()
      .substring(0, SECURITY_CONFIG.VALIDATION.MAX_TEXT_LENGTH);
  }

  /**
   * Rate limiting check (client-side tracking)
   */
  static checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(`rate_${key}`) || '[]');

    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        message: 'Too many attempts. Please try again later.'
      };
    }

    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(`rate_${key}`, JSON.stringify(recentAttempts));

    return { allowed: true };
  }

  /**
   * Generate CSP header value
   */
  static generateCSPHeader() {
    if (!SECURITY_CONFIG.CSP.ENABLED) return '';

    const csp = SECURITY_CONFIG.CSP;
    const directives = [
      `default-src ${csp.DEFAULT_SRC.join(' ')}`,
      `script-src ${csp.SCRIPT_SRC.join(' ')}`,
      `style-src ${csp.STYLE_SRC.join(' ')}`,
      `img-src ${csp.IMG_SRC.join(' ')}`,
      `connect-src ${csp.CONNECT_SRC.join(' ')}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return directives.join('; ');
  }

  /**
   * Log security event (simplified)
   */
  static logSecurityEvent(event, details = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🛡️ Security Event:', logData);
    }

    // In production, this could send to a monitoring service
    // Example: analytics.track('security_event', logData);
  }
}

/**
 * Initialize basic security measures
 */
export function initializeSecurity() {
  try {
    log.info('🛡️ Initializing security measures...');

    // Set CSP meta tag if not already set
    if (SECURITY_CONFIG.CSP.ENABLED && !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      cspMeta.setAttribute('content', SecurityUtils.generateCSPHeader());
      document.head.appendChild(cspMeta);
    }

    // Basic console warning
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '%c🛡️ SECURITY WARNING',
        'color: red; font-size: 20px; font-weight: bold;',
        '\nDo not paste any code here! This could compromise your account.'
      );
    }

    log.info('🛡️ Security initialization completed');
    return true;

  } catch (error) {
    log.error('❌ Security initialization failed:', error);
    return false;
  }
}

// Auto-initialize on import in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  document.addEventListener('DOMContentLoaded', initializeSecurity);
}

export default SECURITY_CONFIG;