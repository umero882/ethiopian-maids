/**
 * PhoneVerificationService Integration Tests
 * Tests for phone verification workflow and database operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import phoneVerificationService from '../phoneVerificationService';
import twilioService from '../twilioService';
import { supabase } from '@/lib/databaseClient';

// Mock dependencies
vi.mock('@/lib/databaseClient', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    supabase: {
      from: vi.fn(() => mockChain),
    },
  };
});

vi.mock('../twilioService', () => ({
  default: {
    validatePhoneNumber: vi.fn(),
    generateVerificationCode: vi.fn(),
    sendVerificationCode: vi.fn(),
    maskPhoneNumber: vi.fn(),
  },
}));

describe('PhoneVerificationService', () => {
  const mockUserId = 'user-123';
  const mockPhoneNumber = '+12025551234';
  const mockVerificationCode = '123456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startVerification', () => {
    it('should start verification successfully', async () => {
      // Setup mocks
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.generateVerificationCode.mockReturnValue(mockVerificationCode);
      twilioService.sendVerificationCode.mockResolvedValue({ success: true });
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');

      // Mock database queries
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // sponsor check
      mockFrom.maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // maid check
      mockFrom.single.mockResolvedValueOnce({
        data: {
          id: 'verification-123',
          user_id: mockUserId,
          phone_number: mockPhoneNumber,
          verification_code: mockVerificationCode,
          code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        error: null,
      });

      // Execute
      const result = await phoneVerificationService.startVerification(mockUserId, mockPhoneNumber);

      // Verify
      expect(result.data).toBeDefined();
      expect(result.data.verificationId).toBe('verification-123');
      expect(result.data.phoneNumber).toBe(mockPhoneNumber);
      expect(result.data.expiresAt).toBeDefined();
      expect(twilioService.sendVerificationCode).toHaveBeenCalledWith(
        mockPhoneNumber,
        mockVerificationCode
      );
    });

    it('should return error for missing user ID', async () => {
      const result = await phoneVerificationService.startVerification(null, mockPhoneNumber);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('User ID is required');
    });

    it('should return error for missing phone number', async () => {
      const result = await phoneVerificationService.startVerification(mockUserId, null);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Phone number is required');
    });

    it('should return error for invalid phone format', async () => {
      twilioService.validatePhoneNumber.mockReturnValue(false);

      const result = await phoneVerificationService.startVerification(
        mockUserId,
        'invalid-phone'
      );

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Invalid phone number format');
    });

    it('should return error if phone already verified by another user', async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: { id: 'sponsor-456', user_id: 'other-user' },
        error: null,
      });

      const result = await phoneVerificationService.startVerification(mockUserId, mockPhoneNumber);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('already verified by another user');
    });

    it('should handle SMS sending failure', async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.generateVerificationCode.mockReturnValue(mockVerificationCode);
      twilioService.sendVerificationCode.mockResolvedValue({
        success: false,
        error: 'SMS failed',
      });

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockFrom.single.mockResolvedValueOnce({
        data: { id: 'verification-123' },
        error: null,
      });

      const result = await phoneVerificationService.startVerification(mockUserId, mockPhoneNumber);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Failed to send SMS');
    });

    it('should handle database errors', async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.generateVerificationCode.mockReturnValue(mockVerificationCode);

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockFrom.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await phoneVerificationService.startVerification(mockUserId, mockPhoneNumber);

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Failed to create verification');
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: mockUserId,
        phone_number: mockPhoneNumber,
        verification_code: mockVerificationCode,
        code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        max_attempts: 3,
        verified: false,
      };

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: mockVerification,
        error: null,
      });

      const result = await phoneVerificationService.verifyCode(
        mockUserId,
        mockPhoneNumber,
        mockVerificationCode
      );

      expect(result.data).toBeDefined();
      expect(result.data.success).toBe(true);
      expect(result.data.phoneNumber).toBe(mockPhoneNumber);
    });

    it('should return error for missing fields', async () => {
      const result = await phoneVerificationService.verifyCode(null, mockPhoneNumber, '123456');

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Missing required fields');
    });

    it('should return error for invalid code format', async () => {
      const result = await phoneVerificationService.verifyCode(mockUserId, mockPhoneNumber, '123');

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Invalid code format');
    });

    it('should return error if verification not found', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await phoneVerificationService.verifyCode(
        mockUserId,
        mockPhoneNumber,
        mockVerificationCode
      );

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('No verification found');
    });

    it('should return error if code expired', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: mockUserId,
        phone_number: mockPhoneNumber,
        verification_code: mockVerificationCode,
        code_expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
        attempts: 0,
        max_attempts: 3,
        verified: false,
      };

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: mockVerification,
        error: null,
      });

      const result = await phoneVerificationService.verifyCode(
        mockUserId,
        mockPhoneNumber,
        mockVerificationCode
      );

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('expired');
    });

    it('should return error if max attempts exceeded', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: mockUserId,
        phone_number: mockPhoneNumber,
        verification_code: mockVerificationCode,
        code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 3,
        max_attempts: 3,
        verified: false,
      };

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: mockVerification,
        error: null,
      });

      const result = await phoneVerificationService.verifyCode(
        mockUserId,
        mockPhoneNumber,
        mockVerificationCode
      );

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Too many failed attempts');
    });

    it('should increment attempts on wrong code', async () => {
      const mockVerification = {
        id: 'verification-123',
        user_id: mockUserId,
        phone_number: mockPhoneNumber,
        verification_code: '999999',
        code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        max_attempts: 3,
        verified: false,
      };

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: mockVerification,
        error: null,
      });

      const result = await phoneVerificationService.verifyCode(
        mockUserId,
        mockPhoneNumber,
        mockVerificationCode
      );

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Invalid code');
      expect(result.error.message).toContain('2 attempts remaining');
    });
  });

  describe('resendCode', () => {
    it('should resend code successfully', async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.generateVerificationCode.mockReturnValue(mockVerificationCode);
      twilioService.sendVerificationCode.mockResolvedValue({ success: true });
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockFrom.single.mockResolvedValueOnce({
        data: {
          id: 'verification-123',
          user_id: mockUserId,
          phone_number: mockPhoneNumber,
        },
        error: null,
      });

      const result = await phoneVerificationService.resendCode(mockUserId, mockPhoneNumber);

      expect(result.data).toBeDefined();
      expect(result.data.verificationId).toBe('verification-123');
    });

    it('should delete old verification before creating new one', async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.generateVerificationCode.mockReturnValue(mockVerificationCode);
      twilioService.sendVerificationCode.mockResolvedValue({ success: true });
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');

      const mockFrom = supabase.from();
      const deleteMock = vi.fn().mockReturnThis();
      mockFrom.delete = deleteMock;
      mockFrom.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockFrom.single.mockResolvedValueOnce({
        data: { id: 'verification-123' },
        error: null,
      });

      await phoneVerificationService.resendCode(mockUserId, mockPhoneNumber);

      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('checkVerificationStatus', () => {
    it('should return verified status for sponsor', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: {
          phone_number: mockPhoneNumber,
          phone_verified: true,
        },
        error: null,
      });

      const result = await phoneVerificationService.checkVerificationStatus(mockUserId);

      expect(result.verified).toBe(true);
      expect(result.phoneNumber).toBe(mockPhoneNumber);
    });

    it('should check maid profile if sponsor not found', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // sponsor
        .mockResolvedValueOnce({
          data: {
            phone_number: mockPhoneNumber,
            phone_verified: true,
          },
          error: null,
        }); // maid

      const result = await phoneVerificationService.checkVerificationStatus(mockUserId);

      expect(result.verified).toBe(true);
      expect(result.phoneNumber).toBe(mockPhoneNumber);
    });

    it('should return not verified if no profile found', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await phoneVerificationService.checkVerificationStatus(mockUserId);

      expect(result.verified).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await phoneVerificationService.checkVerificationStatus(mockUserId);

      expect(result.verified).toBe(false);
    });
  });

  describe('getPendingVerification', () => {
    it('should return pending verification info', async () => {
      const mockPending = {
        id: 'verification-123',
        phone_number: mockPhoneNumber,
        code_expires_at: new Date().toISOString(),
        attempts: 1,
        max_attempts: 3,
        created_at: new Date().toISOString(),
      };

      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');

      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: mockPending,
        error: null,
      });

      const result = await phoneVerificationService.getPendingVerification(mockUserId);

      expect(result.data).toBeDefined();
      expect(result.data.verificationId).toBe('verification-123');
      expect(result.data.attempts).toBe(1);
      expect(result.data.maxAttempts).toBe(3);
    });

    it('should return null if no pending verification', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await phoneVerificationService.getPendingVerification(mockUserId);

      expect(result.data).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockFrom = supabase.from();
      mockFrom.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await phoneVerificationService.getPendingVerification(mockUserId);

      expect(result.error).toBeDefined();
    });
  });
});
