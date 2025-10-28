/**
 * Identity Module - Dependency Injection Setup
 *
 * This file wires up all identity use-cases with their dependencies:
 * - Domain entities
 * - Application use-cases
 * - Infrastructure adapters (Supabase + SendGrid)
 *
 * For backend/server-side use only (uses SERVICE_KEY)
 */

import { createClient } from '@supabase/supabase-js';

// Infrastructure adapters
import {
  SupabaseUserRepository,
  SupabaseAuthService,
  SupabaseAuditLogger,
  SupabasePasswordResetRepository,
  SendGridEmailService,
} from '../../packages/infra/identity/index.js';

// Application use-cases
import {
  RegisterUser,
  SignIn,
  SignOut,
  GetUser,
  VerifyUserEmail,
  RequestPasswordReset,
  ResetPassword,
  UpdateUser,
} from '../../packages/app/identity/index.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = import.meta.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = import.meta.env.SENDGRID_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'noreply@ethiopianmaids.com';
const APP_BASE_URL = import.meta.env.APP_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:5173';

// Validate required configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  throw new Error('Missing Supabase configuration for Identity module');
}

// =============================================================================
// INITIALIZE INFRASTRUCTURE
// =============================================================================

// Create Supabase client with SERVICE_KEY (for backend operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Initialize repositories and services
const userRepository = new SupabaseUserRepository(supabase);
const authService = new SupabaseAuthService(supabase);
const auditLogger = new SupabaseAuditLogger(supabase);
const passwordResetRepository = new SupabasePasswordResetRepository(supabase);

// Initialize email service
const emailService = new SendGridEmailService({
  apiKey: SENDGRID_API_KEY,
  fromEmail: SENDGRID_FROM_EMAIL,
  fromName: 'Ethiopian Maids',
  baseUrl: APP_BASE_URL,
});

// Simple event bus (can be replaced with a more sophisticated implementation)
const eventBus = {
  publish: (event) => {
    console.log(`[Event] ${event.type}`, event.payload);
    // In production, this could publish to a message queue, webhook, etc.
  },
};

// =============================================================================
// CREATE USE-CASES (Dependency Injection)
// =============================================================================

/**
 * User Registration
 * Command: { email, password, role, metadata }
 */
export const registerUser = new RegisterUser({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * User Sign-In
 * Command: { email, password, metadata }
 * Returns: { userId, token, refreshToken, expiresAt, user }
 */
export const signIn = new SignIn({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * User Sign-Out
 * Command: { userId, token, reason, metadata }
 */
export const signOut = new SignOut({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * Get User
 * Query: { userId }
 * Returns: User entity
 */
export const getUser = new GetUser({
  userRepository,
});

/**
 * Verify User Email
 * Command: { userId, token }
 */
export const verifyUserEmail = new VerifyUserEmail({
  userRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * Request Password Reset
 * Command: { email, metadata }
 * Returns: { success, message }
 *
 * Security: Always returns success message (email enumeration protection)
 */
export const requestPasswordReset = new RequestPasswordReset({
  userRepository,
  passwordResetRepository,
  emailService,
  auditLogger,
  eventBus,
});

/**
 * Reset Password
 * Command: { token, newPassword, metadata }
 * Returns: { success, message }
 *
 * Security: Revokes all user sessions after successful reset
 */
export const resetPassword = new ResetPassword({
  userRepository,
  passwordResetRepository,
  authService,
  auditLogger,
  eventBus,
});

/**
 * Update User
 * Command: { userId, updates: { email?, phoneNumber? }, metadata }
 * Returns: Updated user entity
 *
 * Note: Email/phone changes reset verification flags
 */
export const updateUser = new UpdateUser({
  userRepository,
  auditLogger,
  eventBus,
});

// =============================================================================
// EXPORTS
// =============================================================================

// Export all use-cases
export default {
  registerUser,
  signIn,
  signOut,
  getUser,
  verifyUserEmail,
  requestPasswordReset,
  resetPassword,
  updateUser,
};

// Export infrastructure for advanced use cases
export {
  supabase,
  userRepository,
  authService,
  auditLogger,
  passwordResetRepository,
  emailService,
  eventBus,
};

// =============================================================================
// STATUS CHECK
// =============================================================================

console.log('✅ Identity Module initialized');
console.log('📦 Use-cases available:', Object.keys({
  registerUser,
  signIn,
  signOut,
  getUser,
  verifyUserEmail,
  requestPasswordReset,
  resetPassword,
  updateUser,
}).join(', '));

// Log configuration status (without revealing secrets)
console.log('🔧 Configuration:');
console.log('  - Supabase URL:', SUPABASE_URL);
console.log('  - SendGrid configured:', !!SENDGRID_API_KEY);
console.log('  - From Email:', SENDGRID_FROM_EMAIL);
console.log('  - App Base URL:', APP_BASE_URL);
