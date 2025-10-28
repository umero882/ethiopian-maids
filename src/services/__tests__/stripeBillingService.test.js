/**
 * Stripe Billing Service Tests
 * Tests for payment processing and billing functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Stripe
const mockStripe = {
  redirectToCheckout: vi.fn(),
  confirmPayment: vi.fn(),
};

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

// Mock Supabase
const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
  auth: {
    getSession: vi.fn(),
    refreshSession: vi.fn(),
  },
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  single: vi.fn(),
  limit: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
};

// Set up method chaining for Supabase
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);
mockSupabase.in.mockReturnValue(mockSupabase);
mockSupabase.limit.mockReturnValue(mockSupabase);
mockSupabase.order.mockReturnValue(mockSupabase);

vi.mock('@/lib/databaseClient', () => ({
  __esModule: true,
  supabase: mockSupabase,
  default: mockSupabase,
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  toast: mockToast,
}));

// Mock config
vi.mock('@/config/stripeConfig', () => ({
  STRIPE_CONFIG: {
    publishableKey: 'pk_test_123',
  },
  validateStripeConfig: vi.fn(() => ({
    isValid: true,
    errors: [],
    warnings: [],
    critical: [],
  })),
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock payment idempotency service
const mockPaymentIdempotencyService = {
  purchaseCreditsIdempotent: vi.fn(),
  completeCreditPurchase: vi.fn(),
  getCreditBalance: vi.fn(),
  chargeContactFeeIdempotent: vi.fn(),
  getPaymentHistory: vi.fn(),
  updatePaymentStatus: vi.fn(),
};

vi.mock('@/services/paymentIdempotencyService', () => ({
  __esModule: true,
  default: mockPaymentIdempotencyService,
}));

describe('StripeBillingService', () => {
  let stripeBillingService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import after mocks are set up
    const module = await import('../stripeBillingService');
    stripeBillingService = module.stripeBillingService;

    // Reset service state
    stripeBillingService.initialized = false;
    await stripeBillingService.init();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      expect(stripeBillingService.initialized).toBe(true);
    });

    it('should fail initialization with invalid config', async () => {
      const { validateStripeConfig } = await import('@/config/stripeConfig');
      validateStripeConfig.mockReturnValue({
        isValid: false,
        errors: ['Invalid key'],
        warnings: [],
        critical: ['Missing key'],
      });

      stripeBillingService.initialized = false;
      await stripeBillingService.init();

      expect(stripeBillingService.initialized).toBe(false);
    });
  });

  describe('Checkout Session Creation', () => {
    it('should create checkout session with object parameters', async () => {
      const sessionId = 'cs_test_123';
      const checkoutUrl = 'https://checkout.stripe.com/c/pay/test123';

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      // Mock auth session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock_access_token',
            user: { id: 'user123' },
          },
        },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionId, url: checkoutUrl },
        error: null,
      });

      const result = await stripeBillingService.createCheckoutSession({
        userId: 'user123',
        priceId: 'price_123',
        planName: 'Pro',
        userEmail: 'test@example.com',
        billingCycle: 'monthly',
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe(checkoutUrl);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'create-checkout-session',
        expect.objectContaining({
          body: expect.objectContaining({
            userId: 'user123',
            priceId: 'price_123',
            planName: 'Pro',
            userEmail: 'test@example.com',
            billingCycle: 'monthly',
          }),
        })
      );
    });

    it('should create checkout session with positional parameters', async () => {
      const sessionId = 'cs_test_123';
      const checkoutUrl = 'https://checkout.stripe.com/c/pay/test456';

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      // Mock auth session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock_access_token',
            user: { id: 'user123' },
          },
        },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionId, url: checkoutUrl },
        error: null,
      });

      const result = await stripeBillingService.createCheckoutSession(
        'user123',
        'price_123',
        '/success',
        '/cancel'
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe(checkoutUrl);
    });

    it('should handle checkout session creation errors', async () => {
      // Mock auth session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'mock_access_token',
            user: { id: 'user123' },
          },
        },
        error: null,
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Failed to create session' },
      });

      const result = await stripeBillingService.createCheckoutSession({
        userId: 'user123',
        priceId: 'price_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create session');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Payment Error',
          variant: 'destructive',
        })
      );
    });

    it('should handle missing required parameters', async () => {
      const result = await stripeBillingService.createCheckoutSession({
        userId: 'user123',
        // Missing priceId
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing userId or priceId');
    });
  });

  describe('Subscription Management', () => {
    it('should get subscription status', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        subscription_plans: {
          name: 'Pro',
          price: 19.99,
          features: ['Feature 1', 'Feature 2'],
        },
      };

      const maybeSingle = vi.fn().mockResolvedValue({ data: mockSubscription, error: null });
      const limit = vi.fn().mockReturnValue({ maybeSingle });
      const order = vi.fn().mockReturnValue({ limit });
      const inFn = vi.fn().mockReturnValue({ order });
      const eq = vi.fn().mockReturnValue({ in: inFn });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await stripeBillingService.getSubscriptionStatus('user123');

      expect(result.hasActiveSubscription).toBe(true);
      expect(result.subscription).toEqual(mockSubscription);
    });

    it('should handle no active subscription', async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });
      const limit = vi.fn().mockReturnValue({ maybeSingle });
      const order = vi.fn().mockReturnValue({ limit });
      const inFn = vi.fn().mockReturnValue({ order });
      const eq = vi.fn().mockReturnValue({ in: inFn });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await stripeBillingService.getSubscriptionStatus('user123');

      expect(result.hasActiveSubscription).toBe(false);
      expect(result.subscription).toBeNull();
    });

    it('should get subscription plans', async () => {
      const mockPlans = [
        { id: 'plan_1', name: 'Basic', price: 9.99 },
        { id: 'plan_2', name: 'Pro', price: 19.99 },
      ];

      const order = vi.fn().mockResolvedValue({ data: mockPlans, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await stripeBillingService.getSubscriptionPlans();

      expect(result.success).toBe(true);
      expect(result.plans).toEqual(mockPlans);
    });
  });

  describe('Credit System', () => {
    it('should purchase credits successfully', async () => {
      mockPaymentIdempotencyService.purchaseCreditsIdempotent.mockResolvedValue({
        success: true,
        duplicate: false,
        paymentIntent: { client_secret: 'pi_123_secret' },
      });

      // Mock confirmPayment to return success (no error)
      mockStripe.confirmPayment.mockResolvedValue({
        error: null,
        paymentIntent: { id: 'pi_123', status: 'succeeded' }
      });

      const result = await stripeBillingService.purchaseCredits('user123', 10, 'test');

      expect(result.success).toBe(true);
      expect(result.paymentIntent).toBeDefined();
      expect(mockPaymentIdempotencyService.purchaseCreditsIdempotent).toHaveBeenCalledWith(
        'user123',
        10,
        500, // 10 credits * $0.50 = $5.00 = 500 cents
        'test'
      );
    });

    it('should handle duplicate credit purchase', async () => {
      mockPaymentIdempotencyService.purchaseCreditsIdempotent.mockResolvedValue({
        success: true,
        duplicate: true,
        message: 'Duplicate purchase detected',
      });

      const result = await stripeBillingService.purchaseCredits('user123', 10);

      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(true);
    });

    it('should get credit balance', async () => {
      mockPaymentIdempotencyService.getCreditBalance.mockResolvedValue({
        success: true,
        credits: 25,
      });

      const result = await stripeBillingService.getCreditBalance('user123');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(25);
    });

    it('should charge contact fee', async () => {
      mockPaymentIdempotencyService.chargeContactFeeIdempotent.mockResolvedValue({
        success: true,
        remaining_credits: 4,
      });

      const result = await stripeBillingService.chargeContactFee(
        'sponsor123',
        'maid456',
        'Hello, interested in your services'
      );

      expect(result.success).toBe(true);
      expect(mockPaymentIdempotencyService.chargeContactFeeIdempotent).toHaveBeenCalledWith(
        'sponsor123',
        'maid456',
        1, // 1 credit per contact
        'Hello, interested in your services'
      );
    });
  });

  describe('Usage Tracking', () => {
    it('should check usage limits for free tier', async () => {
      // Mock no active subscription
      const maybeSingleSub = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const limitSub = vi.fn().mockReturnValue({ maybeSingle: maybeSingleSub });
      const orderSub = vi.fn().mockReturnValue({ limit: limitSub });
      const inFnSub = vi.fn().mockReturnValue({ order: orderSub });
      const eqSub = vi.fn().mockReturnValue({ in: inFnSub });
      const selectSub = vi.fn().mockReturnValue({ eq: eqSub });

      // Mock usage stats
      const single = vi.fn().mockResolvedValue({ data: { profile_views: 8 }, error: null });
      const gte = vi.fn().mockReturnValue({ single });
      const eq = vi.fn().mockReturnValue({ gte });
      const select = vi.fn().mockReturnValue({ eq });

      mockSupabase.from.mockReturnValueOnce({ select: selectSub }); // for getSubscriptionStatus chain
      mockSupabase.from.mockReturnValue({ select }); // for getUsageStats chain

      const result = await stripeBillingService.checkUsageLimits('user123', 'profile_views');

      expect(result.canUse).toBe(true); // 8 < 10 (free tier limit)
      expect(result.currentUsage).toBe(8);
      expect(result.limit).toBe(10);
      expect(result.isFreeTier).toBe(true);
    });

    it('should track usage', async () => {
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const result = await stripeBillingService.trackUsage('user123', 'profile_views', 1);

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_usage_stat', {
        p_user_id: 'user123',
        p_feature: 'profile_views',
        p_amount: 1,
      });
    });

    it('should get usage statistics', async () => {
      const mockUsage = {
        profile_views: 15,
        contact_requests: 3,
        job_posts: 2,
        messages_sent: 50,
      };

      const single = vi.fn().mockResolvedValue({ data: mockUsage, error: null });
      const gte = vi.fn().mockReturnValue({ single });
      const eq = vi.fn().mockReturnValue({ gte });
      const select = vi.fn().mockReturnValue({ eq });
      mockSupabase.from.mockReturnValue({ select });

      const result = await stripeBillingService.getUsageStats('user123');

      expect(result.success).toBe(true);
      expect(result.usage).toEqual(mockUsage);
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized service', async () => {
      stripeBillingService.initialized = false;

      await expect(stripeBillingService.getStripe()).rejects.toThrow(
        'Payment service is temporarily unavailable'
      );
    });

    it('should handle payment processing errors gracefully', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(
        new Error('Network error')
      );

      const result = await stripeBillingService.createCheckoutSession({
        userId: 'user123',
        priceId: 'price_123',
      });

      expect(result.success).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      );
    });
  });
});
