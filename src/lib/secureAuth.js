/**
 * 🔐 Secure Authentication System
 * Implements secure authentication with rate limiting, session management, and brute force protection
 */

import { supabase } from './supabaseClient';
import { validateField } from './inputValidation';
import { clearCSRFToken } from './csrfProtection';

// =============================================
// RATE LIMITING & BRUTE FORCE PROTECTION
// =============================================

const RATE_LIMIT_STORAGE_KEY = 'auth_rate_limit';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Get rate limiting data for an identifier (email/IP)
 * @param {string} identifier - Email or IP address
 * @returns {Object} Rate limiting data
 */
function getRateLimitData(identifier) {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  const data = stored ? JSON.parse(stored) : {};
  return data[identifier] || { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
}

/**
 * Update rate limiting data
 * @param {string} identifier - Email or IP address
 * @param {Object} data - Rate limiting data
 */
function setRateLimitData(identifier, data) {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  const allData = stored ? JSON.parse(stored) : {};
  allData[identifier] = data;
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(allData));
}

/**
 * Check if identifier is rate limited
 * @param {string} identifier - Email or IP address
 * @returns {Object} Rate limit status
 */
export function checkRateLimit(identifier) {
  const data = getRateLimitData(identifier);
  const now = Date.now();

  // Check if currently locked out
  if (data.lockedUntil > now) {
    const remainingTime = Math.ceil((data.lockedUntil - now) / 1000 / 60);
    return {
      isLimited: true,
      reason: 'locked_out',
      remainingTime,
      message: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
    };
  }

  // Reset attempts if window has passed
  if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
    data.attempts = 0;
  }

  // Check if too many attempts in current window
  if (data.attempts >= MAX_LOGIN_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_DURATION;
    setRateLimitData(identifier, data);
    return {
      isLimited: true,
      reason: 'too_many_attempts',
      remainingTime: Math.ceil(LOCKOUT_DURATION / 1000 / 60),
      message: `Too many failed attempts. Account locked for ${Math.ceil(LOCKOUT_DURATION / 1000 / 60)} minutes.`,
    };
  }

  return { isLimited: false };
}

/**
 * Record a failed login attempt
 * @param {string} identifier - Email or IP address
 */
export function recordFailedAttempt(identifier) {
  const data = getRateLimitData(identifier);
  data.attempts += 1;
  data.lastAttempt = Date.now();
  setRateLimitData(identifier, data);
}

/**
 * Clear rate limiting data on successful login
 * @param {string} identifier - Email or IP address
 */
export function clearRateLimit(identifier) {
  const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  if (stored) {
    const allData = JSON.parse(stored);
    delete allData[identifier];
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(allData));
  }
}

// =============================================
// SECURE SESSION MANAGEMENT
// =============================================

const SESSION_STORAGE_KEY = 'secure_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours of inactivity

/**
 * Create a secure session
 * @param {Object} user - User data
 * @param {Object} supabaseSession - Supabase session
 * @returns {Object} Secure session
 */
function createSecureSession(user, supabaseSession) {
  const now = Date.now();
  return {
    user,
    supabaseSession,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_TIMEOUT,
    csrfToken: crypto.getRandomValues(new Uint8Array(32)).join(''),
  };
}

/**
 * Store session securely with enhanced protection
 * @param {Object} session - Session to store
 */
function storeSession(session) {
  try {
    // Add security metadata
    const secureSession = {
      ...session,
      fingerprint: generateBrowserFingerprint(),
      origin: window.location.origin,
      userAgent: navigator.userAgent.substring(0, 100), // Truncate for storage
    };

    // In production, this should be stored in httpOnly cookies
    // For now, we'll use sessionStorage with additional security measures
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(secureSession));

    // Log security event
  } catch (error) {
    console.error('Failed to store session:', error);
    throw new Error('Session storage failed');
  }
}

/**
 * Generate a basic browser fingerprint for session validation
 * @returns {string} Browser fingerprint
 */
function generateBrowserFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);

  return btoa(
    JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL().substring(0, 50),
    })
  );
}

/**
 * Get current session with enhanced security validation
 * @returns {Object|null} Current session or null
 */
export function getCurrentSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);
    const now = Date.now();

    // Check if session has expired
    if (now > session.expiresAt) {
      console.warn('🔐 Session expired');
      clearSession();
      return null;
    }

    // Check if session has been inactive too long
    if (now - session.lastActivity > ACTIVITY_TIMEOUT) {
      console.warn('🔐 Session inactive timeout');
      clearSession();
      return null;
    }

    // Validate session integrity (basic fingerprint check)
    if (session.fingerprint && session.fingerprint !== generateBrowserFingerprint()) {
      console.warn('🔐 Session fingerprint mismatch - possible session hijacking attempt');
      clearSession();
      return null;
    }

    // Validate origin
    if (session.origin && session.origin !== window.location.origin) {
      console.warn('🔐 Session origin mismatch');
      clearSession();
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    storeSession(session);

    return session;
  } catch (error) {
    console.error('🔐 Error validating session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear current session
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  clearCSRFToken();
}

// =============================================
// SECURE AUTHENTICATION FUNCTIONS
// =============================================

/**
 * Secure login function
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login result
 */
export async function secureLogin(credentials) {
  try {
    // Validate input
    const emailValidation = validateField('email', credentials.email, 'email');
    if (!emailValidation.isValid) {
      throw new Error('Invalid email format');
    }

    const sanitizedEmail = emailValidation.sanitizedValue;

    // Check rate limiting
    const rateLimit = checkRateLimit(sanitizedEmail);
    if (rateLimit.isLimited) {
      throw new Error(rateLimit.message);
    }

    // Attempt login with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: credentials.password,
    });

    if (error) {
      // Record failed attempt
      recordFailedAttempt(sanitizedEmail);
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      recordFailedAttempt(sanitizedEmail);
      throw new Error('Login failed - no user data returned');
    }

    // Clear rate limiting on successful login
    clearRateLimit(sanitizedEmail);

    // Create secure session
    const secureSession = createSecureSession(data.user, data.session);
    storeSession(secureSession);

    // Log security event
    /* console.log('🔐 Secure login successful:', {
      userId: data.user.id,
      email: sanitizedEmail,
      timestamp: new Date().toISOString(),
    }); */

    return {
      success: true,
      user: data.user,
      session: secureSession,
    };
  } catch (error) {
    console.error('🔐 Secure login failed:', error.message);
    throw error;
  }
}

/**
 * Secure logout function
 * @returns {Promise<void>}
 */
export async function secureLogout() {
  try {
    const session = getCurrentSession();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase logout error:', error);
    }

    // Clear local session
    clearSession();

    // Log security event
    if (session) {
      /* console.log('🔐 Secure logout successful:', {
        userId: session.user?.id,
        timestamp: new Date().toISOString(),
      }); */
    }
  } catch (error) {
    console.error('🔐 Secure logout error:', error);
    // Always clear session even if Supabase logout fails
    clearSession();
  }
}

/**
 * Secure registration function
 * @param {Object} credentials - Registration credentials
 * @returns {Promise<Object>} Registration result
 */
export async function secureRegister(credentials) {
  try {
    // Validate all inputs
    const emailValidation = validateField('email', credentials.email, 'email');
    const passwordValidation = validateField(
      'password',
      credentials.password,
      'password'
    );
    const nameValidation = validateField('name', credentials.name, 'name');

    const errors = [];
    if (!emailValidation.isValid) errors.push(...emailValidation.errors);
    if (!passwordValidation.isValid) errors.push(...passwordValidation.errors);
    if (!nameValidation.isValid) errors.push(...nameValidation.errors);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(emailValidation.sanitizedValue);
    if (rateLimit.isLimited) {
      throw new Error(rateLimit.message);
    }

    // Attempt registration with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: emailValidation.sanitizedValue,
      password: credentials.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          name: nameValidation.sanitizedValue,
          user_type: credentials.userType,
          phone: credentials.phone,
          country: credentials.country,
        },
      },
    });

    if (error) {
      recordFailedAttempt(emailValidation.sanitizedValue);
      throw new Error(error.message);
    }

    // Log security event
    /* console.log('🔐 Secure registration successful:', {
      userId: data.user?.id,
      email: emailValidation.sanitizedValue,
      timestamp: new Date().toISOString(),
    }); */

    return {
      success: true,
      user: data.user,
      session: data.session,
      needsVerification: !data.session, // Email verification required
    };
  } catch (error) {
    console.error('🔐 Secure registration failed:', error.message);
    throw error;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Whether user is authenticated
 */
export function isAuthenticated() {
  const session = getCurrentSession();
  return session !== null;
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  const session = getCurrentSession();
  return session?.user || null;
}
