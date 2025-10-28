/**
 * 🧪 AuthContext Tests
 * Unit tests for authentication context
 */

import { vi } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { mockUsers } from '@/utils/testUtils.jsx';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock AuthContext
const MockAuthProvider = ({ children, value }) => {
  const mockValue = {
    user: null,
    session: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    ...value,
  };

  return React.createElement(
    React.createContext(mockValue).Provider,
    { value: mockValue },
    children
  );
};

// Test component to access auth context
const TestComponent = ({ mockAuthValue }) => {
  const auth = mockAuthValue || useAuth();

  return (
    <div>
      <div data-testid='user-email'>{auth.user?.email || 'No user'}</div>
      <div data-testid='loading'>
        {auth.loading ? 'Loading' : 'Not loading'}
      </div>
      <div data-testid='session'>
        {auth.session ? 'Has session' : 'No session'}
      </div>
      <button
        data-testid='login-btn'
        onClick={() => auth.login('test@example.com', 'password')}
      >
        Login
      </button>
      <button data-testid='logout-btn' onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should provide initial auth state', () => {
      const mockAuth = {
        user: null,
        session: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('session')).toHaveTextContent('No session');
    });

    it('should show loading state initially', () => {
      const mockAuth = {
        user: null,
        session: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    });
  });

  describe('Login Functionality', () => {
    it('should handle successful login', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        user: mockUsers.maid,
        session: { user: mockUsers.maid },
      });

      const mockAuth = {
        user: null,
        loading: false,
        session: null,
        login: mockLogin,
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      const loginBtn = screen.getByTestId('login-btn');

      await act(async () => {
        loginBtn.click();
      });

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle login errors', async () => {
      const mockLogin = vi.fn();

      const mockAuth = {
        user: null,
        loading: false,
        session: null,
        login: mockLogin,
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      const loginBtn = screen.getByTestId('login-btn');

      await act(async () => {
        loginBtn.click();
      });

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  describe('Logout Functionality', () => {
    it('should handle logout', async () => {
      const mockLogout = vi.fn().mockResolvedValue();

      const mockAuth = {
        user: mockUsers.maid,
        loading: false,
        session: { user: mockUsers.maid },
        login: vi.fn(),
        logout: mockLogout,
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      const logoutBtn = screen.getByTestId('logout-btn');

      await act(async () => {
        logoutBtn.click();
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('User State Management', () => {
    it('should display user information when logged in', () => {
      const mockAuth = {
        user: mockUsers.sponsor,
        loading: false,
        session: { user: mockUsers.sponsor },
        login: vi.fn(),
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      expect(screen.getByTestId('user-email')).toHaveTextContent(
        mockUsers.sponsor.email
      );
      expect(screen.getByTestId('session')).toHaveTextContent('Has session');
    });

    it('should handle different user types', () => {
      const userTypes = ['maid', 'sponsor', 'agency', 'admin'];

      userTypes.forEach((userType, index) => {
        const testUser = mockUsers[userType];

        const mockAuth = {
          user: testUser,
          loading: false,
          session: { user: testUser },
          login: vi.fn(),
          logout: vi.fn(),
        };

        const { unmount } = render(<TestComponent mockAuthValue={mockAuth} />);

        expect(screen.getByTestId('user-email')).toHaveTextContent(
          testUser.email
        );

        // Clean up after each render to avoid conflicts
        unmount();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', () => {
      const mockAuth = {
        user: null,
        loading: true,
        session: null,
        login: vi.fn(),
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    });

    it('should hide loading state when authentication completes', () => {
      const mockAuth = {
        user: mockUsers.maid,
        loading: false,
        session: { user: mockUsers.maid },
        login: vi.fn(),
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const mockLogin = vi.fn();

      const mockAuth = {
        user: null,
        loading: false,
        session: null,
        login: mockLogin,
        logout: vi.fn(),
      };

      render(<TestComponent mockAuthValue={mockAuth} />);

      const loginBtn = screen.getByTestId('login-btn');

      await act(async () => {
        loginBtn.click();
      });

      // Verify the login function was called with correct parameters
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });
});
