import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock database client used by the service
vi.mock('@/lib/databaseClient', () => {
  const mock = {
    rpc: vi.fn(),
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  return { __esModule: true, supabase: mock, default: mock };
});

// Mock toast and logger
vi.mock('@/components/ui/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import { supabase } from '@/lib/databaseClient';
import paymentIdempotencyService from '../paymentIdempotencyService';

describe('PaymentIdempotencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateIdempotencyKey', () => {
    it('should generate unique keys for different inputs', () => {
      const key1 = paymentIdempotencyService.generateIdempotencyKey('user1', 'purchase', 'context1');
      const key2 = paymentIdempotencyService.generateIdempotencyKey('user2', 'purchase', 'context1');
      const key3 = paymentIdempotencyService.generateIdempotencyKey('user1', 'contact', 'context1');

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    it('should include userId and operationType in the key', () => {
      const key = paymentIdempotencyService.generateIdempotencyKey('user123', 'credit_purchase', 'test');

      expect(key).toContain('user123');
      expect(key).toContain('credit_purchase');
    });
  });

  describe('ensurePaymentIdempotency', () => {
    it('should create new idempotency record when none exists', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [{ is_duplicate: false, payment_record: { id: 'new-record', status: 'pending' } }],
        error: null
      });

      const result = await paymentIdempotencyService.ensurePaymentIdempotency(
        'key123',
        'user123',
        'credit_purchase',
        5000,
        'USD',
        { credits: 100 }
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.paymentRecord.status).toBe('pending');
      expect(supabase.rpc).toHaveBeenCalledWith('ensure_payment_idempotency', {
        p_idempotency_key: 'key123',
        p_user_id: 'user123',
        p_operation_type: 'credit_purchase',
        p_amount: 5000,
        p_currency: 'USD',
        p_metadata: { credits: 100 }
      });
    });

    it('should detect duplicate requests', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [{ is_duplicate: true, payment_record: { id: 'existing-record', status: 'succeeded' } }],
        error: null
      });

      const result = await paymentIdempotencyService.ensurePaymentIdempotency(
        'key123',
        'user123',
        'credit_purchase',
        5000
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.paymentRecord.status).toBe('succeeded');
    });

    it('should throw error when RPC fails', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(
        paymentIdempotencyService.ensurePaymentIdempotency('key123', 'user123', 'purchase', 1000)
      ).rejects.toThrow();
    });
  });

  describe('chargeContactFeeIdempotent', () => {
    it('should successfully charge credits for new contact', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [{
          success: true,
          credits_remaining: 9,
          already_contacted: false,
          insufficient_credits: false
        }],
        error: null
      });

      const result = await paymentIdempotencyService.chargeContactFeeIdempotent(
        'sponsor123',
        'maid456',
        1,
        'I am interested in hiring you'
      );

      expect(result.success).toBe(true);
      expect(result.creditsRemaining).toBe(9);
      expect(result.alreadyContacted).toBeFalsy();
      expect(supabase.rpc).toHaveBeenCalledWith('charge_contact_fee_idempotent', {
        p_sponsor_id: 'sponsor123',
        p_maid_id: 'maid456',
        p_credits_to_charge: 1,
        p_contact_message: 'I am interested in hiring you',
        p_idempotency_key: expect.any(String)
      });
    });

    it('should handle already contacted scenario', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [{
          success: false,
          credits_remaining: 10,
          already_contacted: true,
          insufficient_credits: false
        }],
        error: null
      });

      const result = await paymentIdempotencyService.chargeContactFeeIdempotent(
        'sponsor123',
        'maid456',
        1
      );

      expect(result.success).toBe(false);
      expect(result.alreadyContacted).toBe(true);
      expect(result.message).toContain('already contacted');
    });

    it('should handle insufficient credits scenario', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: [{
          success: false,
          credits_remaining: 0,
          already_contacted: false,
          insufficient_credits: true
        }],
        error: null
      });

      const result = await paymentIdempotencyService.chargeContactFeeIdempotent(
        'sponsor123',
        'maid456',
        1
      );

      expect(result.success).toBe(false);
      expect(result.insufficientCredits).toBe(true);
      expect(result.message).toContain('Insufficient credits');
    });
  });

  describe('getCreditBalance', () => {
    it('should return credit balance for user', async () => {
      supabase.single.mockResolvedValueOnce({
        data: {
          credits_available: 15,
          credits_total_purchased: 50,
          last_purchase_at: '2023-01-01T00:00:00Z'
        },
        error: null
      });

      const result = await paymentIdempotencyService.getCreditBalance('user123');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(15);
      expect(result.totalPurchased).toBe(50);
      expect(supabase.from).toHaveBeenCalledWith('user_credits');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user123');
    });

    it('should return zero credits for new user', async () => {
      supabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No rows found
      });

      const result = await paymentIdempotencyService.getCreditBalance('newuser');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(0);
      expect(result.totalPurchased).toBe(0);
    });

    it('should handle database errors', async () => {
      supabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' }
      });

      const result = await paymentIdempotencyService.getCreditBalance('user123');

      expect(result.success).toBe(false);
      expect(result.credits).toBe(0);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null
      });

      const result = await paymentIdempotencyService.updatePaymentStatus(
        'key123',
        'succeeded',
        'pi_123',
        'ch_123'
      );

      expect(result).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('update_payment_status', {
        p_idempotency_key: 'key123',
        p_status: 'succeeded',
        p_stripe_payment_intent_id: 'pi_123',
        p_stripe_charge_id: 'ch_123'
      });
    });

    it('should handle update failures', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Record not found' }
      });

      await expect(
        paymentIdempotencyService.updatePaymentStatus('invalid-key', 'succeeded')
      ).rejects.toThrow();
    });
  });

  describe('hashString', () => {
    it('should produce consistent hashes for same input', () => {
      const hash1 = paymentIdempotencyService.hashString('test');
      const hash2 = paymentIdempotencyService.hashString('test');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = paymentIdempotencyService.hashString('test1');
      const hash2 = paymentIdempotencyService.hashString('test2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const hash = paymentIdempotencyService.hashString('');

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});


