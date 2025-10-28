/**
 * 🚦 Advanced Rate Limiting
 * Comprehensive rate limiting for different endpoint types
 */

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createLogger } from '@/utils/logger';

const log = createLogger('RateLimiter');

/**
 * Rate limiting configurations for different endpoint types
 */
export const rateLimitConfig = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    },
    handler: (req, res) => {
      log.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
      });
    },
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes',
    },
    handler: (req, res) => {
      log.error(`Authentication rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes',
      });
    },
  },

  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many password reset attempts, please try again later.',
      retryAfter: '1 hour',
    },
    handler: (req, res) => {
      log.error(`Password reset rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many password reset attempts, please try again later.',
        retryAfter: '1 hour',
      });
    },
  },

  // File upload endpoints
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 uploads per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many file uploads, please try again later.',
      retryAfter: '15 minutes',
    },
    handler: (req, res) => {
      log.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many file uploads, please try again later.',
        retryAfter: '15 minutes',
      });
    },
  },

  // SMS/Phone verification (strict)
  sms: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 SMS per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many SMS verification requests, please try again later.',
      retryAfter: '1 hour',
    },
    handler: (req, res) => {
      log.error(`SMS rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many SMS verification requests, please try again later.',
        retryAfter: '1 hour',
      });
    },
  },

  // Search endpoints
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many search requests, please slow down.',
      retryAfter: '1 minute',
    },
    handler: (req, res) => {
      log.warn(`Search rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many search requests, please slow down.',
        retryAfter: '1 minute',
      });
    },
  },

  // Admin endpoints (moderate)
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // 200 requests per 5 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many admin requests, please try again later.',
      retryAfter: '5 minutes',
    },
    handler: (req, res) => {
      log.warn(`Admin rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many admin requests, please try again later.',
        retryAfter: '5 minutes',
      });
    },
  },
};

/**
 * Slow down configurations for progressive delays
 */
export const slowDownConfig = {
  // General slow down
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per window without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Max delay of 20 seconds
  },

  // Authentication slow down
  auth: {
    windowMs: 15 * 60 * 1000,
    delayAfter: 2, // Start slowing down after 2 requests
    delayMs: 1000, // 1 second delay per request
    maxDelayMs: 30000, // Max 30 second delay
  },
};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(type = 'general', customConfig = {}) {
  const config = { ...rateLimitConfig[type], ...customConfig };

  if (!config) {
    log.error(`Unknown rate limiter type: ${type}`);
    return rateLimit(rateLimitConfig.general);
  }

  return rateLimit(config);
}

/**
 * Create slow down middleware
 */
export function createSlowDown(type = 'general', customConfig = {}) {
  const config = { ...slowDownConfig[type], ...customConfig };

  if (!config) {
    log.error(`Unknown slow down type: ${type}`);
    return slowDown(slowDownConfig.general);
  }

  return slowDown(config);
}

/**
 * Advanced rate limiter with multiple strategies
 */
export function createAdvancedRateLimiter(options = {}) {
  const {
    type = 'general',
    enableSlowDown = true,
    customRateLimit = {},
    customSlowDown = {},
  } = options;

  const middlewares = [];

  // Add slow down middleware first
  if (enableSlowDown) {
    middlewares.push(createSlowDown(type, customSlowDown));
  }

  // Add rate limiting middleware
  middlewares.push(createRateLimiter(type, customRateLimit));

  return middlewares;
}

/**
 * IP-based rate limiter with whitelist
 */
export function createIPRateLimiter(options = {}) {
  const {
    whitelist = [],
    type = 'general',
    skipWhitelisted = true,
  } = options;

  return createRateLimiter(type, {
    skip: (req) => {
      if (skipWhitelisted && whitelist.includes(req.ip)) {
        log.debug(`IP ${req.ip} whitelisted, skipping rate limit`);
        return true;
      }
      return false;
    },
  });
}

/**
 * User-based rate limiter (requires authentication)
 */
export function createUserRateLimiter(options = {}) {
  const {
    type = 'general',
    keyGenerator = (req) => req.user?.id || req.ip,
  } = options;

  return createRateLimiter(type, {
    keyGenerator,
    handler: (req, res) => {
      const userId = req.user?.id;
      if (userId) {
        log.warn(`User rate limit exceeded for user: ${userId}, IP: ${req.ip}`);
      } else {
        log.warn(`Rate limit exceeded for IP: ${req.ip}`);
      }

      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: rateLimitConfig[type].windowMs / 1000 / 60 + ' minutes',
      });
    },
  });
}

/**
 * Endpoint-specific rate limiters
 */
export const rateLimiters = {
  // General API
  general: createRateLimiter('general'),

  // Authentication
  auth: createRateLimiter('auth'),

  // Password operations
  passwordReset: createRateLimiter('passwordReset'),

  // File operations
  upload: createRateLimiter('upload'),

  // SMS operations
  sms: createRateLimiter('sms'),

  // Search operations
  search: createRateLimiter('search'),

  // Admin operations
  admin: createRateLimiter('admin'),

  // Combined limiters
  authWithSlowDown: createAdvancedRateLimiter({
    type: 'auth',
    enableSlowDown: true
  }),

  uploadWithSlowDown: createAdvancedRateLimiter({
    type: 'upload',
    enableSlowDown: true
  }),
};

/**
 * Dynamic rate limiter based on user type
 */
export function createUserTypeRateLimiter(req, res, next) {
  const userType = req.user?.user_type;

  switch (userType) {
    case 'admin':
      return rateLimiters.admin(req, res, next);
    case 'agency':
      // Agencies might need higher limits for bulk operations
      return createRateLimiter('general', { max: 300 })(req, res, next);
    default:
      return rateLimiters.general(req, res, next);
  }
}

/**
 * Rate limit bypass for development
 */
export function developmentBypass(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    log.debug('Development mode: bypassing rate limits');
    return next();
  }

  return rateLimiters.general(req, res, next);
}

/**
 * Security headers middleware
 */
export function securityHeaders(req, res, next) {
  // Rate limiting headers
  res.setHeader('X-RateLimit-Policy', 'General API rate limiting active');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

/**
 * Export configured middleware for easy use
 */
export default {
  rateLimiters,
  createRateLimiter,
  createSlowDown,
  createAdvancedRateLimiter,
  createIPRateLimiter,
  createUserRateLimiter,
  createUserTypeRateLimiter,
  developmentBypass,
  securityHeaders,
};