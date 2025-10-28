import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock useAuth to control user state
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
    loading: false,
  }),
}));

import DashboardLayout from '@/components/dashboard/DashboardLayout';

let mockUser;

const renderLayout = (children = <div data-testid='content'>Child</div>) =>
  render(
    <BrowserRouter>
      <DashboardLayout>{children}</DashboardLayout>
    </BrowserRouter>
  );

describe('Dashboard profile completion indicators', () => {
  beforeEach(() => {
    mockUser = {
      id: 'user-1',
      name: 'Test User',
      userType: 'sponsor',
      registration_complete: false,
    };
  });

  it('shows profile completion indicators when profile is incomplete', () => {
    renderLayout();
    // Dashboard title changes to "Complete Your Profile"
    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    // Sidebar shows "Complete Profile" link
    expect(screen.getByText('Complete Profile')).toBeInTheDocument();
  });

  it('shows normal dashboard when profile is complete', () => {
    mockUser.registration_complete = true;
    renderLayout();
    // Dashboard title shows user type dashboard
    expect(screen.getByText('Sponsor Dashboard')).toBeInTheDocument();
    // Sidebar shows "Overview" instead of "Complete Profile"
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.queryByText('Complete Profile')).not.toBeInTheDocument();
  });
});
