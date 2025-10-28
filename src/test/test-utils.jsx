import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { vi } from 'vitest';

// Custom render function with providers
const AllProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <AuthProvider>
          <ChatProvider>
            <SubscriptionProvider>
              {children}
            </SubscriptionProvider>
          </ChatProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) => {
  const { initialEntries = ['/'], ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <AllProviders>{children}</AllProviders>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Enhanced render function for testing with specific contexts
export const renderWithProviders = (ui, options = {}) => {
  const {
    authState = null,
    initialRoute = '/',
    ...renderOptions
  } = options;

  const TestWrapper = ({ children }) => {
    return (
      <BrowserRouter>
        <AccessibilityProvider>
          <AuthProvider initialState={authState}>
            <ChatProvider>
              <SubscriptionProvider>
                {children}
              </SubscriptionProvider>
            </ChatProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </BrowserRouter>
    );
  };

  return rtlRender(ui, { wrapper: TestWrapper, ...renderOptions });
};

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  full_name: 'Test User',
  userType: 'maid',
  registration_complete: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Mock maid profile factory
export const createMockMaidProfile = (overrides = {}) => ({
  id: 'maid-123',
  full_name: 'Test Maid',
  nationality: 'Ethiopian',
  dateOfBirth: '1990-01-01',
  experience: 5,
  skills: ['housekeeping', 'childcare'],
  languages: ['English', 'Amharic'],
  salaryExpectations: 2000,
  availability: 'immediately',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Mock agency profile factory
export const createMockAgencyProfile = (overrides = {}) => ({
  id: 'agency-123',
  name: 'Test Agency',
  license: 'LIC-123456',
  location: 'Dubai',
  contactEmail: 'agency@test.com',
  contactPhone: '+971501234567',
  established: '2010',
  verified: true,
  ...overrides,
});

// Mock job posting factory
export const createMockJobPosting = (overrides = {}) => ({
  id: 'job-123',
  title: 'Housekeeping Position',
  location: 'Dubai',
  jobType: 'full-time',
  salary: 2500,
  requirements: ['housekeeping', 'cooking'],
  description: 'Looking for an experienced housemaid',
  postedBy: 'sponsor-123',
  status: 'open',
  created_at: new Date().toISOString(),
  ...overrides,
});

// Utility functions for common testing scenarios

// Wait for element to appear
export const waitForElementToAppear = async (getElement, timeout = 5000) => {
  return await waitFor(getElement, { timeout });
};

// Wait for element to disappear
export const waitForElementToDisappear = async (element, timeout = 5000) => {
  return await waitFor(() => {
    expect(element).not.toBeInTheDocument();
  }, { timeout });
};

// Fill form helper
export const fillForm = async (fields) => {
  const user = userEvent.setup();

  for (const [fieldName, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));

    if (field.type === 'checkbox') {
      if (value) {
        await user.click(field);
      }
    } else if (field.tagName === 'SELECT') {
      await user.selectOptions(field, value);
    } else {
      await user.clear(field);
      await user.type(field, String(value));
    }
  }
};

// Submit form helper
export const submitForm = async (formRole = 'form') => {
  const user = userEvent.setup();
  const form = screen.getByRole(formRole);
  const submitButton = within(form).getByRole('button', { name: /submit|save|register|login/i });
  await user.click(submitButton);
};

// Navigation helper
export const navigateTo = async (linkText) => {
  const user = userEvent.setup();
  const link = screen.getByRole('link', { name: new RegExp(linkText, 'i') });
  await user.click(link);
};

// File upload helper
export const uploadFile = async (inputElement, file) => {
  const user = userEvent.setup();
  await user.upload(inputElement, file);
};

// Create mock file
export const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
  return new File([''], name, { type, size });
};

// Mock API responses
export const mockApiResponse = (data, delay = 100) => {
  return new Promise(resolve => {
    setTimeout(() => resolve({ data }), delay);
  });
};

export const mockApiError = (error = 'Network error', delay = 100) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(error)), delay);
  });
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// Mock window.matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
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

// Mock fetch
export const mockFetch = (response = {}, ok = true) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      status: ok ? 200 : 400,
      statusText: ok ? 'OK' : 'Bad Request',
    })
  );
};

// Accessibility testing helpers
export const checkAccessibility = async (container) => {
  const { violations } = await axe(container);
  return violations;
};

// Performance testing helpers
export const measureRenderTime = (renderFn) => {
  const start = performance.now();
  const result = renderFn();
  const end = performance.now();
  return {
    renderTime: end - start,
    result,
  };
};

// Custom matchers for Jest
export const customMatchers = {
  toBeAccessible: async (received) => {
    const violations = await checkAccessibility(received);
    const pass = violations.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element to have accessibility violations`
          : `Expected element to be accessible but found ${violations.length} violations:\n${violations
              .map(v => `- ${v.description}`)
              .join('\n')}`,
    };
  },

  toHaveLoadedWithin: (received, timeout) => {
    const pass = received <= timeout;
    return {
      pass,
      message: () =>
        pass
          ? `Expected component to take longer than ${timeout}ms to load`
          : `Expected component to load within ${timeout}ms but took ${received}ms`,
    };
  },
};

// Test setup function
export const setupTests = () => {
  // Mock necessary browser APIs
  mockIntersectionObserver();
  mockResizeObserver();
  mockMatchMedia();

  // Mock localStorage and sessionStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage(),
  });

  // Mock window.open
  Object.defineProperty(window, 'open', {
    value: vi.fn(),
  });

  // Mock navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('')),
    },
  });

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
  });

  // Extend Jest matchers
  expect.extend(customMatchers);
};

// Test data generators
export const generateTestData = {
  users: (count = 5) => Array.from({ length: count }, (_, i) =>
    createMockUser({ id: `user-${i}`, email: `user${i}@test.com` })
  ),

  maids: (count = 10) => Array.from({ length: count }, (_, i) =>
    createMockMaidProfile({
      id: `maid-${i}`,
      firstName: `Maid${i}`,
      lastName: 'Test',
    })
  ),

  jobs: (count = 8) => Array.from({ length: count }, (_, i) =>
    createMockJobPosting({
      id: `job-${i}`,
      title: `Job ${i}`,
    })
  ),
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override the default render
export { customRender as render };
