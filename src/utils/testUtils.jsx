/**
 * 🧪 Test Utilities
 * Standardized testing helpers for Ethiopian Maids Platform
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, expect } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Mock Supabase client
export const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

// Mock user profiles for different roles
export const mockUsers = {
  maid: {
    id: 'maid-123',
    email: 'maid@example.com',
    user_type: 'maid',
    name: 'Test Maid',
    registration_complete: true,
    is_active: true,
  },
  sponsor: {
    id: 'sponsor-123',
    email: 'sponsor@example.com',
    user_type: 'sponsor',
    name: 'Test Sponsor',
    registration_complete: true,
    is_active: true,
  },
  agency: {
    id: 'agency-123',
    email: 'agency@example.com',
    user_type: 'agency',
    name: 'Test Agency',
    registration_complete: true,
    is_active: true,
  },
  admin: {
    id: 'admin-123',
    email: 'admin@example.com',
    user_type: 'admin',
    name: 'Test Admin',
    registration_complete: true,
    is_active: true,
  },
};

// Mock auth context
export const createMockAuthContext = (user = null, loading = false) => ({
  user,
  loading,
  session: user ? { user } : null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn(),
  updateRegistrationStatus: vi.fn(),
  updateUserProfileData: vi.fn(),
  fixUserType: vi.fn(),
});

// Test wrapper with all providers
export const TestWrapper = ({
  children,
  initialRoute = '/',
  authContext = createMockAuthContext(),
  chatContext = {},
  subscriptionContext = {},
}) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider mockValue={authContext}>
        <ChatProvider mockValue={chatContext}>
          <SubscriptionProvider mockValue={subscriptionContext}>
            {children}
          </SubscriptionProvider>
        </ChatProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

// Custom render function with providers
export const renderWithProviders = (
  ui,
  { initialRoute = '/', user = null, loading = false, ...renderOptions } = {}
) => {
  const authContext = createMockAuthContext(user, loading);

  const Wrapper = ({ children }) => (
    <TestWrapper initialRoute={initialRoute} authContext={authContext}>
      {children}
    </TestWrapper>
  );

  return {
    user: userEvent.setup(),
    authContext,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Simplified render for basic component tests
export const renderComponent = (component, options = {}) => {
  const renderResult = render(component, options);
  return {
    ...renderResult,
    user: userEvent.setup(),
    screen: renderResult,
  };
};

// Helper to wait for async operations
export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
};

// Helper to mock API responses
export const mockApiResponse = (data, error = null) => {
  return Promise.resolve({ data, error });
};

// Helper to mock file upload
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
) => {
  return new File(['test content'], name, { type, size });
};

// Helper to test form validation
export const testFormValidation = async (user, formElement, testCases) => {
  for (const testCase of testCases) {
    const { field, value, expectedError } = testCase;

    const input = screen.getByLabelText(new RegExp(field, 'i'));
    await user.clear(input);
    await user.type(input, value);

    // Trigger validation (usually on blur or form submit)
    await user.tab();

    if (expectedError) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(expectedError, 'i'))
        ).toBeInTheDocument();
      });
    } else {
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    }
  }
};

// Helper to test role-based access
export const testRoleAccess = async (Component, roles) => {
  for (const [role, shouldHaveAccess] of Object.entries(roles)) {
    const user = mockUsers[role];
    const { container } = renderWithProviders(<Component />, { user });

    if (shouldHaveAccess) {
      expect(container.firstChild).not.toBeNull();
    } else {
      await waitFor(() => {
        expect(
          screen.getByText(/access denied|unauthorized/i)
        ).toBeInTheDocument();
      });
    }
  }
};

// Helper to test loading states
export const testLoadingStates = async (Component, props = {}) => {
  // Test initial loading
  const { rerender } = renderWithProviders(
    <Component {...props} loading={true} />
  );
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Test loaded state
  rerender(<Component {...props} loading={false} />);
  await waitForLoadingToFinish();
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
};

// Helper to test error states
export const testErrorStates = async (Component, props = {}) => {
  const error = new Error('Test error message');
  renderWithProviders(<Component {...props} error={error} />);

  await waitFor(() => {
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });
};

// Helper to test pagination
export const testPagination = async (user, Component, props = {}) => {
  renderWithProviders(<Component {...props} />);

  // Test next page
  const nextButton = screen.getByRole('button', { name: /next/i });
  await user.click(nextButton);

  // Test previous page
  const prevButton = screen.getByRole('button', { name: /previous/i });
  await user.click(prevButton);

  // Test page numbers
  const pageButton = screen.getByRole('button', { name: /page 2/i });
  await user.click(pageButton);
};

// Helper to test search functionality
export const testSearch = async (user, searchTerm = 'test') => {
  const searchInput = screen.getByRole('textbox', { name: /search/i });
  await user.type(searchInput, searchTerm);

  // Wait for debounced search
  await waitFor(
    () => {
      expect(screen.getByDisplayValue(searchTerm)).toBeInTheDocument();
    },
    { timeout: 1000 }
  );
};

// Helper to test filters
export const testFilters = async (user, filters) => {
  for (const [filterName, filterValue] of Object.entries(filters)) {
    const filterElement = screen.getByLabelText(new RegExp(filterName, 'i'));

    if (filterElement.type === 'select-one') {
      await user.selectOptions(filterElement, filterValue);
    } else if (filterElement.type === 'checkbox') {
      await user.click(filterElement);
    } else {
      await user.type(filterElement, filterValue);
    }
  }
};

// Helper to test responsive design
export const testResponsiveDesign = (Component, props = {}) => {
  const breakpoints = [
    { width: 320, height: 568 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1024, height: 768 }, // Desktop
  ];

  breakpoints.forEach(({ width, height }) => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      value: width,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: height,
      writable: true,
    });

    const { container } = renderWithProviders(<Component {...props} />);
    expect(container.firstChild).toMatchSnapshot(`${width}x${height}`);
  });
};

// Mock localStorage for tests
export const mockLocalStorage = () => {
  const store = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

// Setup function for tests
export const setupTest = () => {
  // Mock localStorage - only if not already defined
  if (!window.localStorage) {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    });
  }

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Cleanup function for tests
export const cleanupTest = () => {
  vi.clearAllMocks();
  localStorage.clear();
};
