/**
 * Authentication and Authorization Middleware
 * Provides request/response interceptors for API calls
 */

import { hasPermission, validateSecurityContext, isRateLimited } from './rbac';
import { createLogger } from '@/utils/logger';

const log = createLogger('AuthMiddleware');

/**
 * Request interceptor to add auth headers and validate permissions
 */
export function createAuthRequestInterceptor(getUser, getSession) {
  return async (config) => {
    const user = getUser();
    const session = getSession();

    // Add authorization header
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Add user context headers
    if (user) {
      config.headers['X-User-ID'] = user.id;
      config.headers['X-User-Type'] = user.userType;
    }

    // Extract permission requirement from config
    const requiredPermission = config.meta?.requiredPermission;
    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      throw new Error(`Insufficient permissions: ${requiredPermission}`);
    }

    // Validate security context
    if (user && !validateSecurityContext(user, null, config.meta?.action || 'api_call')) {
      throw new Error('Security validation failed');
    }

    // Rate limiting check
    if (config.meta?.rateLimitKey && isRateLimited(user, config.meta.rateLimitKey)) {
      throw new Error('Rate limit exceeded');
    }

    log.debug('Request intercepted:', {
      url: config.url,
      method: config.method,
      hasAuth: !!session?.access_token,
      permission: requiredPermission,
    });

    return config;
  };
}

/**
 * Response interceptor to handle auth errors
 */
export function createAuthResponseInterceptor(onAuthError) {
  return {
    onFulfilled: (response) => {
      return response;
    },
    onRejected: (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      // Handle specific auth errors
      if (status === 401) {
        log.warn('Authentication failed:', message);
        onAuthError?.(error, 'unauthorized');
      } else if (status === 403) {
        log.warn('Authorization failed:', message);
        onAuthError?.(error, 'forbidden');
      } else if (status === 429) {
        log.warn('Rate limit exceeded:', message);
        onAuthError?.(error, 'rate_limited');
      }

      return Promise.reject(error);
    }
  };
}

/**
 * API call wrapper with built-in auth checks
 */
export class AuthenticatedAPIClient {
  constructor(baseClient, getUser, getSession) {
    this.client = baseClient;
    this.getUser = getUser;
    this.getSession = getSession;

    // Setup interceptors
    this.client.interceptors.request.use(
      createAuthRequestInterceptor(getUser, getSession)
    );

    this.client.interceptors.response.use(
      ...Object.values(createAuthResponseInterceptor(this.handleAuthError))
    );
  }

  handleAuthError = (error, type) => {
    log.error(`Auth error (${type}):`, error.message);

    // Emit custom event for auth errors
    window.dispatchEvent(new CustomEvent('auth:error', {
      detail: { error, type }
    }));
  }

  /**
   * Make an authenticated API call
   */
  async call(config) {
    try {
      const response = await this.client(config);
      return response.data;
    } catch (error) {
      // Re-throw with enhanced error info
      const enhancedError = new Error(error.message);
      enhancedError.status = error.response?.status;
      enhancedError.code = error.response?.data?.code;
      enhancedError.details = error.response?.data?.details;
      throw enhancedError;
    }
  }

  /**
   * Convenience methods for common HTTP methods
   */
  async get(url, config = {}) {
    return this.call({ ...config, method: 'GET', url });
  }

  async post(url, data, config = {}) {
    return this.call({ ...config, method: 'POST', url, data });
  }

  async put(url, data, config = {}) {
    return this.call({ ...config, method: 'PUT', url, data });
  }

  async patch(url, data, config = {}) {
    return this.call({ ...config, method: 'PATCH', url, data });
  }

  async delete(url, config = {}) {
    return this.call({ ...config, method: 'DELETE', url });
  }
}

/**
 * Permission-based API method decorator
 */
export function requiresPermission(permission) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const user = this.getUser?.();

      if (!hasPermission(user, permission)) {
        throw new Error(`Method ${propertyKey} requires permission: ${permission}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Rate limiting decorator
 */
export function rateLimit(action, limit = 10) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const calls = new Map();

    descriptor.value = async function(...args) {
      const user = this.getUser?.();
      const userId = user?.id || 'anonymous';
      const key = `${userId}:${action}`;

      const now = Date.now();
      const windowStart = now - (60 * 1000); // 1 minute window

      // Clean old entries
      const userCalls = calls.get(key) || [];
      const recentCalls = userCalls.filter(time => time > windowStart);

      if (recentCalls.length >= limit) {
        throw new Error(`Rate limit exceeded for action: ${action}`);
      }

      // Record this call
      recentCalls.push(now);
      calls.set(key, recentCalls);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Security context validation decorator
 */
export function validateSecurity(action) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const user = this.getUser?.();

      if (user && !validateSecurityContext(user, null, action)) {
        throw new Error(`Security validation failed for action: ${action}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Create secured service class
 */
export function createSecuredService(serviceClass, getUser, getSession) {
  return class extends serviceClass {
    constructor(...args) {
      super(...args);
      this.getUser = getUser;
      this.getSession = getSession;
    }

    // Override any HTTP methods to add auth
    async makeRequest(config) {
      const interceptor = createAuthRequestInterceptor(this.getUser, this.getSession);
      const securedConfig = await interceptor(config);
      return super.makeRequest?.(securedConfig) || config;
    }
  };
}

export default {
  createAuthRequestInterceptor,
  createAuthResponseInterceptor,
  AuthenticatedAPIClient,
  requiresPermission,
  rateLimit,
  validateSecurity,
  createSecuredService,
};