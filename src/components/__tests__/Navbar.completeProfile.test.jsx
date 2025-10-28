import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter as BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

let mockUser;

// Mock useAuth to control user state
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
    loading: false,
  }),
}));

// Mock all UI components that might have complex dependencies
vi.mock('@/components/ui/button', () => {
  const mockReact = require('react');
  return {
    Button: ({ children, asChild, ...props }) => {
      if (asChild && children) {
        // Return the child element directly for asChild prop
        return children;
      }
      return mockReact.createElement('button', props, children);
    },
  };
});

vi.mock('lucide-react', () => ({
  Home: () => <span>Home</span>,
  Users: () => <span>Users</span>,
  Briefcase: () => <span>Briefcase</span>,
  Bell: () => <span>Bell</span>,
  UserCircle: () => <span>UserCircle</span>,
  LogOut: () => <span>LogOut</span>,
  Menu: () => <span>Menu</span>,
  X: () => <span>X</span>,
  DollarSign: () => <span>DollarSign</span>,
  ShieldCheck: () => <span>ShieldCheck</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Headphones: () => <span>Headphones</span>,
  Lock: () => <span>Lock</span>,
  LogIn: () => <span>LogIn</span>,
  UserPlus: () => <span>UserPlus</span>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <div>{children}</div>,
}));

import Navbar from '@/components/Navbar';

const renderNavbar = (user) => {
  mockUser = user;
  return render(
    <BrowserRouter initialEntries={["/"]}>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Complete Profile CTA', () => {
  beforeEach(() => {
    mockUser = {
      id: 'user-1',
      name: 'Test User',
      userType: 'sponsor',
      registration_complete: false,
    };
  });

  it('shows Dashboard link when user is logged in', () => {
    renderNavbar(mockUser);
    // Dashboard link should be present for logged-in users
    expect(screen.getAllByText(/Dashboard/i)[0]).toBeInTheDocument();
  });

  it('shows Dashboard link when profile is complete', () => {
    const completeUser = {
      id: 'user-1',
      name: 'Test User',
      userType: 'sponsor',
      registration_complete: true,
    };
    renderNavbar(completeUser);
    // Dashboard link should be present
    expect(screen.getAllByText(/Dashboard/i)[0]).toBeInTheDocument();
    // Logout button should be present (multiple matches due to icon + text)
    expect(screen.getAllByText(/Logout/i).length).toBeGreaterThan(0);
  });
});
