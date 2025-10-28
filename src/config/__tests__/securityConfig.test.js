import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SECURITY_CONFIG, SecurityUtils, initializeSecurity } from '../securityConfig';

// Mock DOM methods
const mockCreateElement = vi.fn();
const mockQuerySelector = vi.fn();
const mockAppendChild = vi.fn();

Object.defineProperty(global, 'document', {
  value: {
    createElement: mockCreateElement,
    querySelector: mockQuerySelector,
    head: {
      appendChild: mockAppendChild
    },
    addEventListener: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-agent'
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    location: { href: 'http://localhost:3000' },
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn()
    }
  },
  writable: true
});

Object.defineProperty(global, 'localStorage', {
  value: window.localStorage,
  writable: true
});

describe('SECURITY_CONFIG', () => {
  it('should have correct authentication settings', () => {
    expect(SECURITY_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS).toBe(5);
    expect(SECURITY_CONFIG.AUTH.LOCKOUT_DURATION).toBe(15 * 60 * 1000);
    expect(SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH).toBe(8);
    expect(SECURITY_CONFIG.AUTH.REQUIRE_STRONG_PASSWORD).toBe(true);
  });

  it('should have file upload restrictions', () => {
    expect(SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE).toBe(5 * 1024 * 1024);
    expect(SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES).toContain('image/jpeg');
    expect(SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES).toContain('application/pdf');
    expect(SECURITY_CONFIG.FILE_UPLOAD.FORBIDDEN_EXTENSIONS).toContain('.exe');
    expect(SECURITY_CONFIG.FILE_UPLOAD.FORBIDDEN_EXTENSIONS).toContain('.js');
  });

  it('should have CSP configuration', () => {
    expect(SECURITY_CONFIG.CSP.DEFAULT_SRC).toContain("'self'");
    expect(SECURITY_CONFIG.CSP.SCRIPT_SRC).toContain('https://js.stripe.com');
    expect(SECURITY_CONFIG.CSP.CONNECT_SRC).toContain('https://*.supabase.co');
  });
});

describe('SecurityUtils', () => {
  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const result = SecurityUtils.validatePassword('StrongPass123');

      expect(result.valid).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      const result = SecurityUtils.validatePassword('Short1');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('8 characters');
    });

    it('should reject passwords without uppercase', () => {
      const result = SecurityUtils.validatePassword('lowercase123');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should reject passwords without lowercase', () => {
      const result = SecurityUtils.validatePassword('UPPERCASE123');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should reject passwords without numbers', () => {
      const result = SecurityUtils.validatePassword('OnlyLetters');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('numbers');
    });

    it('should handle empty passwords', () => {
      const result = SecurityUtils.validatePassword('');

      expect(result.valid).toBe(false);
    });

    it('should handle null passwords', () => {
      const result = SecurityUtils.validatePassword(null);

      expect(result.valid).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should accept valid files', () => {
      const mockFile = {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        name: 'test.jpg'
      };

      const result = SecurityUtils.validateFile(mockFile);

      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const mockFile = {
        size: 10 * 1024 * 1024, // 10MB
        type: 'image/jpeg',
        name: 'large.jpg'
      };

      const result = SecurityUtils.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('5MB');
    });

    it('should reject disallowed file types', () => {
      const mockFile = {
        size: 1024,
        type: 'application/javascript',
        name: 'script.js'
      };

      const result = SecurityUtils.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('File type not allowed');
    });

    it('should reject forbidden extensions', () => {
      const mockFile = {
        size: 1024,
        type: 'application/octet-stream',
        name: 'malware.exe'
      };

      const result = SecurityUtils.validateFile(mockFile);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('extension not allowed');
    });
  });

  describe('sanitizeText', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = SecurityUtils.sanitizeText(input);

      expect(result).toBe('Hello  World');
      expect(result).not.toContain('<script>');
    });

    it('should remove HTML tags', () => {
      const input = 'Hello <div>World</div>';
      const result = SecurityUtils.sanitizeText(input);

      expect(result).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = SecurityUtils.sanitizeText(input);

      expect(result).toBe('Hello World');
    });

    it('should truncate long text', () => {
      const input = 'a'.repeat(2000);
      const result = SecurityUtils.sanitizeText(input);

      expect(result.length).toBe(SECURITY_CONFIG.VALIDATION.MAX_TEXT_LENGTH);
    });

    it('should handle empty input', () => {
      const result = SecurityUtils.sanitizeText('');

      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = SecurityUtils.sanitizeText(null);

      expect(result).toBe('');
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset localStorage mocks
      window.localStorage.getItem.mockReturnValue(null);
    });

    it('should allow requests within limits', () => {
      window.localStorage.getItem.mockReturnValue('[]');

      const result = SecurityUtils.checkRateLimit('test-key', 5, 60000);

      expect(result.allowed).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    it('should block requests exceeding limits', () => {
      const now = Date.now();
      const recentAttempts = Array(5).fill(now - 1000); // 5 attempts 1 second ago
      window.localStorage.getItem.mockReturnValue(JSON.stringify(recentAttempts));

      const result = SecurityUtils.checkRateLimit('test-key', 5, 60000);

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Too many attempts');
    });

    it('should clean up old attempts', () => {
      const now = Date.now();
      const oldAttempts = [now - 120000, now - 90000]; // 2 minutes ago
      const recentAttempts = [now - 1000]; // 1 second ago
      window.localStorage.getItem.mockReturnValue(
        JSON.stringify([...oldAttempts, ...recentAttempts])
      );

      SecurityUtils.checkRateLimit('test-key', 5, 60000);

      // Should only store recent attempts + current attempt
      const storedData = JSON.parse(window.localStorage.setItem.mock.calls[0][1]);
      expect(storedData.length).toBe(2); // 1 recent + 1 current
    });
  });

  describe('generateCSPHeader', () => {
    it('should generate CSP header when enabled', () => {
      // Mock process.env.NODE_ENV to 'production'
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const header = SecurityUtils.generateCSPHeader();

      expect(header).toContain("default-src 'self'");
      expect(header).toContain('https://js.stripe.com');
      expect(header).toContain("object-src 'none'");

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('should return empty string when disabled', () => {
      // Mock process.env.NODE_ENV to 'development'
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const header = SecurityUtils.generateCSPHeader();

      expect(header).toBe('');

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logSecurityEvent', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log events in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      SecurityUtils.logSecurityEvent('test_event', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '🛡️ Security Event:',
        expect.objectContaining({
          event: 'test_event',
          details: { data: 'test' }
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log events in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      SecurityUtils.logSecurityEvent('test_event', { data: 'test' });

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('initializeSecurity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateElement.mockReturnValue({
      setAttribute: vi.fn()
    });
    mockQuerySelector.mockReturnValue(null); // No existing CSP meta tag
  });

  it('should initialize successfully in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const result = initializeSecurity();

    expect(result).toBe(true);
    expect(mockCreateElement).toHaveBeenCalledWith('meta');
    expect(mockAppendChild).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should skip CSP in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const result = initializeSecurity();

    expect(result).toBe(true);
    expect(mockCreateElement).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not add duplicate CSP meta tags', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Mock existing CSP meta tag
    mockQuerySelector.mockReturnValue({ content: 'existing-csp' });

    initializeSecurity();

    expect(mockCreateElement).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle initialization errors gracefully', () => {
    mockCreateElement.mockImplementation(() => {
      throw new Error('DOM error');
    });

    const result = initializeSecurity();

    expect(result).toBe(false);
  });
});