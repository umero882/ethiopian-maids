/**
 * Comprehensive Subscription Service Tests
 * Tests all subscription lifecycle scenarios and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import subscriptionService from '../subscriptionService';
import { supabase } from '@/lib/databaseClient';

// Mock Supabase client
vi.mock('@/lib/databaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('SubscriptionService - Comprehensive Tests', () => {
  const mockUserId = 'user-123';
  const mockSubscriptionId = 'sub-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveSubscription', () => {
    it('should return active subscription', async () => {
      const mockSubscription = {
        id: mockSubscriptionId,
        user_id: mockUserId,
        plan_type: 'pro',
        status: 'active',
        end_date: '2025-02-23',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.getActiveSubscription(mockUserId);

      expect(result).toEqual(mockSubscription);
      expect(result.status).toBe('active');
    });

    it('should return past_due subscription', async () => {
      const mockSubscription = {
        id: mockSubscriptionId,
        user_id: mockUserId,
        plan_type: 'pro',
        status: 'past_due',
        end_date: '2025-02-06',
      };

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockSubscription,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.getActiveSubscription(mockUserId);

      expect(result).toEqual(mockSubscription);
      expect(result.status).toBe('past_due');
    });

    it('should return null for user with no subscription (free plan)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.getActiveSubscription(mockUserId);

      expect(result).toBeNull();
    });

    it('should handle PGRST116 error (no rows) gracefully', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.getActiveSubscription(mockUserId);

      expect(result).toBeNull();
    });

    it('should timeout after 3 seconds', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 5000))
        ),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.getActiveSubscription(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription with trial end date', async () => {
      const subscriptionData = {
        userId: mockUserId,
        planId: 'pro_monthly',
        planName: 'Professional',
        planType: 'pro',
        amount: 299,
        currency: 'AED',
        billingPeriod: 'monthly',
        startDate: '2025-01-23',
        endDate: '2025-02-23',
        trialEndDate: '2025-02-06',
      };

      const mockCreatedSub = {
        id: mockSubscriptionId,
        ...subscriptionData,
        user_id: mockUserId,
        status: 'active', // Service always creates as active
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedSub,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result.status).toBe('active');
      expect(result.plan_type).toBe('pro');
    });

    it('should create subscription without trial (direct active)', async () => {
      const subscriptionData = {
        userId: mockUserId,
        planId: 'pro_monthly',
        planName: 'Professional',
        planType: 'pro',
        amount: 299,
        currency: 'AED',
        billingPeriod: 'monthly',
        startDate: '2025-01-23',
        endDate: '2025-02-23',
        trialEndDate: null,
      };

      const mockCreatedSub = {
        id: mockSubscriptionId,
        ...subscriptionData,
        user_id: mockUserId,
        status: 'active',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedSub,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result.status).toBe('active');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription status', async () => {
      const updates = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockSubscriptionId, ...updates },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.updateSubscription(
        mockSubscriptionId,
        updates
      );

      expect(result.status).toBe('cancelled');
      expect(result.cancelled_at).toBeDefined();
    });

    it('should handle past_due status with grace period', async () => {
      const updates = {
        status: 'past_due',
        grace_period_ends: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        payment_retry_count: 1,
      };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockSubscriptionId, ...updates },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.updateSubscription(
        mockSubscriptionId,
        updates
      );

      expect(result.status).toBe('past_due');
      expect(result.grace_period_ends).toBeDefined();
      expect(result.payment_retry_count).toBe(1);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      const now = new Date().toISOString();

      // Mock the Edge Function call
      supabase.functions.invoke.mockResolvedValue({
        data: {
          id: mockSubscriptionId,
          status: 'cancelled',
          cancelled_at: now,
        },
        error: null,
      });

      const result = await subscriptionService.cancelSubscription(mockSubscriptionId);

      expect(result.status).toBe('cancelled');
      expect(result.cancelled_at).toBeDefined();
      expect(supabase.functions.invoke).toHaveBeenCalledWith('cancel-subscription', {
        body: {
          subscriptionId: mockSubscriptionId,
          cancelImmediately: false,
        },
      });
    });
  });

  describe('changePlan - Upgrade Scenarios', () => {
    it('should upgrade from free to pro', async () => {
      // Mock: user currently has no subscription (free)
      const mockGetActiveChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Mock: create new pro subscription
      const mockCreateChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockSubscriptionId,
            user_id: mockUserId,
            plan_type: 'pro',
            status: 'active', // Service creates as active
          },
          error: null,
        }),
      };

      supabase.from.mockReturnValueOnce(mockGetActiveChain);
      supabase.from.mockReturnValueOnce(mockCreateChain);

      const planDetails = {
        planId: 'pro_monthly',
        planName: 'Professional',
        amount: 299,
        features: {},
      };

      const result = await subscriptionService.changePlan(
        mockUserId,
        'pro',
        planDetails
      );

      expect(result.plan_type).toBe('pro');
      expect(result.status).toBe('active');
    });

    it('should upgrade from pro to premium (immediate)', async () => {
      // Mock: user has active pro subscription
      const mockGetActiveChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: mockSubscriptionId,
            user_id: mockUserId,
            plan_type: 'pro',
            status: 'active',
          },
          error: null,
        }),
      };

      // Mock: update to premium
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockSubscriptionId,
            user_id: mockUserId,
            plan_type: 'premium',
            status: 'active',
          },
          error: null,
        }),
      };

      supabase.from.mockReturnValueOnce(mockGetActiveChain);
      supabase.from.mockReturnValueOnce(mockUpdateChain);

      const planDetails = {
        planName: 'Premium',
        amount: 899,
        features: {},
      };

      const result = await subscriptionService.changePlan(
        mockUserId,
        'premium',
        planDetails
      );

      expect(result.plan_type).toBe('premium');
    });
  });

  describe('changePlan - Downgrade Scenarios', () => {
    it('should downgrade from pro to free', async () => {
      // Mock: user has active pro subscription
      const mockGetActiveChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: mockSubscriptionId,
            user_id: mockUserId,
            plan_type: 'pro',
            status: 'active',
          },
          error: null,
        }),
      };

      supabase.from.mockReturnValueOnce(mockGetActiveChain);

      // Mock: Edge Function for cancel subscription
      supabase.functions.invoke.mockResolvedValue({
        data: {
          id: mockSubscriptionId,
          status: 'active', // Subscription remains active until period end
          cancelled_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await subscriptionService.changePlan(mockUserId, 'free', {});

      expect(result.status).toBe('active'); // Still active until period ends
      expect(result.cancelled_at).toBeDefined();
    });

    it('should downgrade from premium to pro', async () => {
      // Mock: user has active premium subscription
      const mockGetActiveChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: mockSubscriptionId,
            user_id: mockUserId,
            plan_type: 'premium',
            status: 'active',
            metadata: {},
          },
          error: null,
        }),
      };

      // Mock: update subscription
      const mockUpdateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockSubscriptionId,
            plan_type: 'pro',
            metadata: {
              previous_plan: 'premium',
              scheduled_change: true,
            },
          },
          error: null,
        }),
      };

      supabase.from.mockReturnValueOnce(mockGetActiveChain);
      supabase.from.mockReturnValueOnce(mockUpdateChain);

      const planDetails = {
        planName: 'Professional',
        amount: 299,
        features: {},
      };

      const result = await subscriptionService.changePlan(
        mockUserId,
        'pro',
        planDetails
      );

      expect(result.plan_type).toBe('pro');
    });
  });

  describe('Subscription Status Checks', () => {
    it('should detect expired subscription', () => {
      const expiredSub = {
        id: mockSubscriptionId,
        status: 'active',
        end_date: '2025-01-01', // Past date
      };

      const isExpired = subscriptionService.isSubscriptionExpired(expiredSub);

      expect(isExpired).toBe(true);
    });

    it('should not mark future subscription as expired', () => {
      const activeSub = {
        id: mockSubscriptionId,
        status: 'active',
        end_date: '2025-12-31', // Future date
      };

      const isExpired = subscriptionService.isSubscriptionExpired(activeSub);

      expect(isExpired).toBe(false);
    });

    it('should get correct subscription status', () => {
      const trialSub = {
        status: 'trial',
        end_date: '2025-02-06',
      };

      const status = subscriptionService.getSubscriptionStatus(trialSub);

      expect(status).toBe('trial');
    });

    it('should return "free" for null subscription', () => {
      const status = subscriptionService.getSubscriptionStatus(null);

      expect(status).toBe('free');
    });

    it('should return "expired" for past-due subscription beyond end_date', () => {
      const expiredSub = {
        status: 'active',
        end_date: '2025-01-01',
      };

      const status = subscriptionService.getSubscriptionStatus(expiredSub);

      expect(status).toBe('expired');
    });
  });

  describe('Days Remaining Calculation', () => {
    it('should calculate correct days remaining', () => {
      const futureSub = {
        end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const daysRemaining = subscriptionService.getDaysRemaining(futureSub);

      expect(daysRemaining).toBeGreaterThanOrEqual(9);
      expect(daysRemaining).toBeLessThanOrEqual(11); // Allow 1-day margin
    });

    it('should return 0 for expired subscription', () => {
      const expiredSub = {
        end_date: '2025-01-01',
      };

      const daysRemaining = subscriptionService.getDaysRemaining(expiredSub);

      expect(daysRemaining).toBe(0);
    });

    it('should return 0 for null end_date', () => {
      const noEndDateSub = {
        end_date: null,
      };

      const daysRemaining = subscriptionService.getDaysRemaining(noEndDateSub);

      expect(daysRemaining).toBe(0);
    });
  });

  describe('Plan Type Resolution', () => {
    it('should return free for null subscription', () => {
      const planType = subscriptionService.getPlanType(null);

      expect(planType).toBe('free');
    });

    it('should return free for expired subscription', () => {
      const expiredSub = {
        plan_type: 'pro',
        status: 'expired',
      };

      const planType = subscriptionService.getPlanType(expiredSub);

      expect(planType).toBe('free');
    });

    it('should return correct plan for active subscription', () => {
      const activeSub = {
        plan_type: 'premium',
        status: 'active',
        end_date: '2025-12-31',
      };

      const planType = subscriptionService.getPlanType(activeSub);

      expect(planType).toBe('premium');
    });
  });

  describe('Stripe Price ID Retrieval', () => {
    it('should get correct price ID for agency pro monthly', () => {
      const priceId = subscriptionService.getStripePriceId('agency', 'pro', 'monthly');

      expect(priceId).toBeDefined();
      expect(typeof priceId).toBe('string');
    });

    it('should get correct price ID for maid premium annual', () => {
      const priceId = subscriptionService.getStripePriceId('maid', 'premium', 'annual');

      expect(priceId).toBeDefined();
      expect(typeof priceId).toBe('string');
    });

    it('should return null for invalid combinations', () => {
      const priceId = subscriptionService.getStripePriceId('invalid', 'pro', 'monthly');

      expect(priceId).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent subscription updates', async () => {
      // This tests race conditions
      const updates1 = { status: 'active' };
      const updates2 = { status: 'cancelled' };

      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockSubscriptionId, ...updates2 },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const [result1, result2] = await Promise.all([
        subscriptionService.updateSubscription(mockSubscriptionId, updates1),
        subscriptionService.updateSubscription(mockSubscriptionId, updates2),
      ]);

      // Last write should win
      expect(result2.status).toBe('cancelled');
    });

    it('should handle missing payment method gracefully', async () => {
      const subscriptionData = {
        userId: mockUserId,
        planId: 'pro_monthly',
        planName: 'Professional',
        planType: 'pro',
        amount: 299,
        currency: 'AED',
        billingPeriod: 'monthly',
        startDate: '2025-01-23',
        endDate: '2025-02-23',
        stripeCustomerId: null, // No payment method
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...subscriptionData, id: mockSubscriptionId },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockChain);

      const result = await subscriptionService.createSubscription(subscriptionData);

      expect(result).toBeDefined();
    });
  });
});
