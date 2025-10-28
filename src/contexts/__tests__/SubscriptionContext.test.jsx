import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SubscriptionProvider, useSubscription } from '../SubscriptionContext';

// Mock the entire AuthContext module
const mockUser = { id: 'test-user', userType: 'maid' };
vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    session: { user: mockUser },
    loading: false,
  })),
  AuthProvider: ({ children }) => React.createElement(React.Fragment, {}, children),
}));

describe('SubscriptionContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    vi.clearAllMocks();
  });

  test('hasFeatureAccess returns true for PRO plan', () => {
    // Set up localStorage with proper JSON values
    localStorage.setItem('subscriptionPlan', '"pro"');
    const wrapper = ({ children }) => (
      <SubscriptionProvider>{children}</SubscriptionProvider>
    );
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.hasFeatureAccess('profileViews')).toBe(true);
  });

  test('hasReachedLimit detects usage limit', async () => {
    localStorage.setItem('subscriptionPlan', '"free"');
    localStorage.setItem(
      'usageStats',
      JSON.stringify({ profileViews: 0, jobApplications: 5, messageThreads: 0 })
    );
    const wrapper = ({ children }) => (
      <SubscriptionProvider>{children}</SubscriptionProvider>
    );
    const { result } = renderHook(() => useSubscription(), { wrapper });

    // Wait for the subscription context to be initialized
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // For maid free plan, jobApplications limit is 5
    // With usage at 5, hasReachedLimit should return true (5 >= 5)
    expect(result.current.hasReachedLimit('jobApplications')).toBe(true);
  });

  test('incrementUsage updates usage count', () => {
    localStorage.setItem('subscriptionPlan', '"free"');
    localStorage.setItem(
      'usageStats',
      JSON.stringify({ profileViews: 0, jobApplications: 0, messageThreads: 0 })
    );

    const wrapper = ({ children }) => (
      <SubscriptionProvider>{children}</SubscriptionProvider>
    );
    const { result } = renderHook(() => useSubscription(), { wrapper });

    // Wait for initial render to complete
    expect(result.current.usageStats.profileViews).toBe(0);

    act(() => {
      result.current.incrementUsage('profileViews');
    });

    expect(result.current.usageStats.profileViews).toBe(1);
  });
});
