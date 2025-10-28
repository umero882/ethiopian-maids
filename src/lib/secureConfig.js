/**
 * Secure Configuration Management
 * Handles environment variables with security best practices
 * Updated to use centralized environment configuration
 */

import {
  envConfig,
  databaseConfig,
  appConfig,
  featureFlags,
} from '@/config/environmentConfig';
import { createLogger } from '@/utils/logger';

const log = createLogger('SecureConfig');

// Client-side configuration (safe to expose)
export const clientConfig = {
  database: databaseConfig,
  app: { ...appConfig, useMockData: featureFlags.mockData },
  features: featureFlags,
};

// Validation
export function validateClientConfig() {
  const errors = [];
  const warnings = [];

  // Validate local database configuration
  if (typeof clientConfig.database.useLocal !== 'boolean') {
    warnings.push('VITE_USE_LOCAL_DATABASE should be a boolean value');
  }

  if (!clientConfig.database.databaseName || clientConfig.database.databaseName.trim() === '') {
    warnings.push('VITE_DATABASE_NAME should be specified');
  }

  // Note: For local development, we have minimal validation requirements
  if (clientConfig.database.useLocal) {
    log.info('Using local SQLite database for development');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function getSecureConfig() {
  const validation = validateClientConfig();
  if (!validation.isValid) {
    log.error('Configuration validation failed', validation.errors);
    if (validation.warnings.length > 0) {
      log.warn('Configuration warnings', validation.warnings);
    }
    throw new Error(
      'Invalid configuration. Please check your environment variables.'
    );
  }
  if (validation.warnings.length > 0) {
    log.warn('Configuration warnings', validation.warnings);
  }
  return clientConfig;
}

// Security utilities
export function isSecureContext() {
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

export function logSecurityWarnings() {
  if (import.meta.env.DEV) {
    if (!isSecureContext() && window.location.hostname !== 'localhost') {
      log.warn('Not running in secure context (HTTPS)');
    }
    if (clientConfig.app.useMockData) {
      log.warn('Using mock data - not suitable for production');
    }
    log.debug('Configuration validated successfully');
  }
}

if (typeof window !== 'undefined') {
  logSecurityWarnings();
}
