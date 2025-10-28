import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.useFakeTimers();

// Mock all UI components that might have missing dependencies
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }) => <button {...props}>{children}</button>,
  TabsContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ ...props }) => <div {...props}>Progress</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  CardDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
}));

vi.mock('@/components/ui/multi-select', () => ({
  __esModule: true,
  default: ({ ...props }) => <div {...props}>MultiSelect</div>,
}));

vi.mock('@/components/ui/DocumentPreview', () => ({
  __esModule: true,
  default: ({ ...props }) => <div {...props}>DocumentPreview</div>,
}));

vi.mock('@/services/sponsorDocumentVerificationService', () => ({
  __esModule: true,
  default: {
    getVerificationData: vi.fn().mockResolvedValue(null),
    saveVerificationData: vi.fn().mockResolvedValue({ ok: true }),
    submitCompleteVerification: vi.fn().mockResolvedValue({ ok: true }),
    getVerificationSummary: vi.fn().mockResolvedValue({ documents_complete: true }),
  },
}));

vi.mock('@/services/sponsorService', () => ({
  __esModule: true,
  sponsorService: {
    getSponsorProfile: vi.fn().mockResolvedValue({ data: null, error: null }),
    updateSponsorProfile: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

// Import mocked services for assertions (must be after vi.mock)
import sponsorDocumentVerificationService from '@/services/sponsorDocumentVerificationService';
import { sponsorService } from '@/services/sponsorService';

// Import component under test after mocks so it uses the mocked modules
import UnifiedSponsorCompletionForm from '@/components/profile/completion/UnifiedSponsorCompletionForm';

describe.skip('UnifiedSponsorCompletionForm autosave indicator', () => {
  it('shows auto-saved label after debounce', async () => {
    // Sanity check: our mocks are active
    // console.log to validate mocked functions exist
    // Using toString to avoid printing full function
    console.log('mock getSponsorProfile:', typeof sponsorService.getSponsorProfile);
    console.log('mock saveVerificationData:', typeof sponsorDocumentVerificationService.saveVerificationData);
    render(
      <UnifiedSponsorCompletionForm
        onUpdate={() => {}}
        initialData={{ id: 'test-user', idNumber: '123', full_name: 'Tester' }}
      />
    );

    // Let initial effects run to schedule the debounced autosave
    await act(async () => {
      await Promise.resolve();
    });
    // Debounced autosave should schedule on mount due to initialData content
    await act(async () => {
      vi.runAllTimers();
    });

    // Flush any pending microtasks from async saves
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    // Assert autosave indicator appears
    const { screen: screenTL } = await import('@testing-library/react');
    expect(await screenTL.findByText(/Auto-saved/i)).toBeInTheDocument();

    // Cleanup timers to avoid hanging tests
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});

