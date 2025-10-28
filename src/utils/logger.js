/**
 * Professional Logging Service
 * Centralized logging with environment-based control
 *
 * SECURITY: In production, console logs are disabled to prevent information disclosure
 * In development, logs are enabled for debugging purposes
 *
 * Usage:
 *   import logger from '@/utils/logger';
 *   logger.error('Something went wrong', { context: data });
 *
 * Or create scoped loggers:
 *   const log = createLogger('ModuleName');
 *   log.debug('Debug message', data);
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// Get current environment
function getEnvironment() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE || import.meta.env.DEV ? 'development' : 'production';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'production';
  }
  return 'production';
}

// Check if debug mode is enabled
function isDebugEnabled() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true';
  }
  return false;
}

// Determine minimum log level based on environment
function currentLevel() {
  const env = getEnvironment();
  const debugMode = isDebugEnabled();

  // In production, only show warnings and errors (unless debug mode is explicitly enabled)
  if (env === 'production' && !debugMode) {
    return LEVELS.warn;
  }

  // In development or with debug mode, show all logs
  return LEVELS.debug;
}

function formatScope(scope) {
  return scope ? `[${scope}]` : '';
}

/**
 * Store critical errors in localStorage for debugging
 */
function storeError(scope, msg, args) {
  try {
    const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    errors.push({
      timestamp: new Date().toISOString(),
      scope,
      message: msg,
      data: args,
    });
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.shift();
    }
    localStorage.setItem('app_errors', JSON.stringify(errors));
  } catch (e) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Create a scoped logger instance
 * @param {string} scope - The scope/module name for this logger
 * @returns {object} Logger instance with debug, info, warn, error methods
 */
export function createLogger(scope = '') {
  const base = formatScope(scope);
  const min = currentLevel();

  return {
    debug: (msg, ...args) => {
      if (LEVELS.debug >= min) console.debug(base, msg, ...args);
    },
    info: (msg, ...args) => {
      if (LEVELS.info >= min) console.info(base, msg, ...args);
    },
    warn: (msg, ...args) => {
      if (LEVELS.warn >= min) console.warn(base, msg, ...args);
    },
    error: (msg, ...args) => {
      // Always emit errors (even in production)
      console.error(base, msg, ...args);
      // Store errors for debugging
      storeError(scope, msg, args);
    },
    // Additional utility methods
    api: (method, url, data = {}) => {
      if (LEVELS.info >= min) {
        console.log(`${base} [API] ${method} ${url}`, data);
      }
    },
    performance: (label, duration) => {
      if (LEVELS.info >= min) {
        console.log(`${base} [PERF] ${label}: ${duration}ms`);
      }
    },
  };
}

/**
 * Default app logger
 */
export const log = createLogger('App');

/**
 * Global logger utilities
 */
const logger = {
  ...createLogger('Global'),

  /**
   * Get stored errors from localStorage (for debugging)
   */
  getStoredErrors: () => {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Clear stored errors
   */
  clearStoredErrors: () => {
    try {
      localStorage.removeItem('app_errors');
    } catch {
      // Silently fail
    }
  },

  /**
   * Create a scoped logger
   */
  scope: createLogger,
};

export default logger;
