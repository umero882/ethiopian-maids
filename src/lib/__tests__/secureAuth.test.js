/**
 * Security Authentication Tests
 * Tests for secure authentication flows and protections
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  getCurrentSession,
  secureLogin,
  secureLogout,
  secureRegister,
  isAuthenticated,
  getCurrentUser,
} from '../secureAuth';

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

vi.mock('../inputValidation', () => ({
  validateField: vi.fn((field, value, type) => ({
    isValid: true,
    sanitizedValue: value,
    errors: [],
  })),
}));

vi.mock('../csrfProtection', () => ({
  clearCSRFToken: vi.fn(),
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should allow requests under the limit', () => {
    const result = checkRateLimit('test@example.com');
    expect(result.isLimited).toBe(false);
  });

  it('should block requests over the limit', () => {
    const email = 'test@example.com';

    // Record 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(email);
    }

    const result = checkRateLimit(email);
    expect(result.isLimited).toBe(true);
    expect(result.reason).toBe('too_many_attempts');
  });

  it('should clear rate limit data', () => {
    const email = 'test@example.com';
    recordFailedAttempt(email);

    clearRateLimit(email);

    const result = checkRateLimit(email);
    expect(result.isLimited).toBe(false);
  });

  it('should reset attempts after time window', () => {
    const email = 'test@example.com';

    // Mock localStorage to simulate old attempts
    const oldData = {
      [email]: {
        attempts: 3,
        lastAttempt: Date.now() - (2 * 60 * 1000), // 2 minutes ago
        lockedUntil: 0,
      },
    };
    localStorage.setItem('auth_rate_limit', JSON.stringify(oldData));

    const result = checkRateLimit(email);
    expect(result.isLimited).toBe(false);
  });
});

describe('Session Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    // Mock canvas for fingerprinting
    const mockCanvas = {
      getContext: vi.fn(() => ({
        textBaseline: '',
        font: '',
        fillText: vi.fn(),
      })),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    };
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return {};
    });

    // Mock screen and navigator
    Object.defineProperty(screen, 'width', { value: 1920, writable: true });
    Object.defineProperty(screen, 'height', { value: 1080, writable: true });
    Object.defineProperty(navigator, 'language', { value: 'en-US', writable: true });
    Object.defineProperty(navigator, 'platform', { value: 'Win32', writable: true });

    // Mock Intl
    global.Intl = {
      DateTimeFormat: vi.fn(() => ({
        resolvedOptions: () => ({ timeZone: 'UTC' }),
      })),
    };

    // Mock btoa
    global.btoa = vi.fn((str) => Buffer.from(str).toString('base64'));
  });

  it('should return null for no session', () => {
    const session = getCurrentSession();
    expect(session).toBeNull();
  });

  it('should validate session integrity', () => {
    const mockSession = {
      user: { id: '123', email: 'test@example.com' },
      expiresAt: Date.now() + 1000000,
      lastActivity: Date.now(),
      fingerprint: 'valid-fingerprint',
      origin: window.location.origin,
    };

    sessionStorage.setItem('secure_session', JSON.stringify(mockSession));

    // This should return null because fingerprint won't match
    const session = getCurrentSession();
    expect(session).toBeNull();
  });

  it('should expire old sessions', () => {
    const mockSession = {
      user: { id: '123' },
      expiresAt: Date.now() - 1000, // Expired
      lastActivity: Date.now(),
    };

    sessionStorage.setItem('secure_session', JSON.stringify(mockSession));

    const session = getCurrentSession();
    expect(session).toBeNull();
  });
});

describe('Secure Authentication', () => {
  const mockSupabase = require('../supabaseClient').supabase;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Secure Login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123' };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await secureLogin({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(secureLogin({
        email: 'test@example.com',
        password: 'wrongpassword',
      })).rejects.toThrow('Invalid credentials');
    });

    it('should respect rate limiting', async () => {
      const email = 'test@example.com';

      // Trigger rate limiting
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(email);
      }

      await expect(secureLogin({
        email,
        password: 'password123',
      })).rejects.toThrow(/locked/i);
    });
  });

  describe('Secure Registration', () => {
    it('should successfully register with valid data', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await secureRegister({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        userType: 'maid',
        phone: '+1234567890',
        country: 'US',
      });

      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(true);
    });

    it('should validate input data', async () => {
      const { validateField } = require('../inputValidation');
      validateField.mockReturnValue({
        isValid: false,
        errors: ['Invalid email format'],
      });

      await expect(secureRegister({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      })).rejects.toThrow('Invalid email format');
    });
  });

  describe('Authentication State', () => {
    it('should check if user is authenticated', () => {
      // No session
      expect(isAuthenticated()).toBe(false);

      // With valid session
      const mockSession = {
        user: { id: '123' },
        expiresAt: Date.now() + 1000000,
        lastActivity: Date.now(),
        fingerprint: 'test-fingerprint',
        origin: window.location.origin,
      };

      sessionStorage.setItem('secure_session', JSON.stringify(mockSession));
      // This will return false because fingerprint validation will fail
      expect(isAuthenticated()).toBe(false);
    });

    it('should get current user', () => {
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('Secure Logout', () => {
    it('should clear session on logout', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await secureLogout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(sessionStorage.getItem('secure_session')).toBeNull();
    });

    it('should clear session even if Supabase logout fails', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      sessionStorage.setItem('secure_session', JSON.stringify({ test: 'data' }));

      await secureLogout();

      expect(sessionStorage.getItem('secure_session')).toBeNull();
    });
  });
});