/**
 * Admin Panel Configuration
 *
 * Set ADMIN_DEVELOPMENT_MODE to true to enable development mode
 * with mock data and no database requirements.
 */

// Development mode flag - set to true for development access
export const ADMIN_DEVELOPMENT_MODE = true;

// Development credentials (any email/password will work in dev mode)
export const DEV_ADMIN_CREDENTIALS = {
  email: 'admin@ethiomaids.dev',
  password: 'admin123'
};

// Mock admin user for development
export const DEV_ADMIN_USER = {
  id: 'dev-admin-123',
  email: 'admin@ethiomaids.dev',
  full_name: 'Development Admin',
  role: 'super_admin',
  is_active: true,
  department: 'Development',
  created_at: new Date().toISOString(),
  last_login_at: new Date().toISOString()
};

// Feature flags for development
export const DEV_FEATURES = {
  userManagement: true,
  systemSettings: true,
  contentModeration: false,
  financialManagement: false,
  analytics: true,
  auditLogs: true
};

// Development configuration
export const DEV_CONFIG = {
  showDevelopmentBanner: true,
  enableMockData: true,
  simulateNetworkDelay: true,
  defaultNetworkDelay: 800, // ms
  logAllActions: true
};