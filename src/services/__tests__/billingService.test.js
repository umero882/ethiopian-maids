import { vi, beforeEach, describe, test, expect } from 'vitest';

// Mock the stripeBillingService since billingService redirects to it
vi.mock('../stripeBillingService', () => ({
  __esModule: true,
  default: {
    createCheckoutSession: vi.fn().mockResolvedValue({
      success: true,
    }),
    createPortalSession: vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    }),
  },
}));

let billingService;

describe('billingService', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    // Import after mocks are applied so the mocked stripeBillingService is used
    billingService = (await import('../billingService')).billingService;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('createSubscription returns success from redirect flow', async () => {
    const promise = billingService.createSubscription(
      'user1',
      'maid',
      'plan_basic'
    );
    vi.runAllTimers();
    const result = await promise;
    expect(result.success).toBe(true);
  });

  test('changePlan updates planId', async () => {
    const promise = billingService.changePlan('sub_123', 'plan_pro');
    vi.runAllTimers();
    const result = await promise;
    expect(result.id).toBe('sub_123');
    expect(result.planId).toBe('plan_pro');
  });

  test('cancelSubscription handles immediate cancel', async () => {
    const promise = billingService.cancelSubscription('sub_123', false);
    vi.runAllTimers();
    const result = await promise;
    expect(result.status).toBe('canceled');
    expect(result.cancelAtPeriodEnd).toBe(false);
  });

  test('calculateTax computes tax for AE', async () => {
    const promise = billingService.calculateTax('cus_1', 10000, {
      country: 'AE',
    });
    vi.runAllTimers();
    const result = await promise;
    expect(result.taxAmount).toBe(500);
    expect(result.taxRate).toBe(0.05);
    expect(result.totalWithTax).toBe(10500);
  });
});
