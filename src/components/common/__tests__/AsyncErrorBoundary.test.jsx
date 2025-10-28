import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncErrorBoundary from '../AsyncErrorBoundary';

// Mock components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="mock-button"
    >
      {children}
    </button>
  )
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false, errorType = 'generic' }) => {
  if (shouldThrow) {
    const error = new Error(
      errorType === 'network'
        ? 'Network request failed'
        : 'Something went wrong'
    );
    if (errorType === 'network') {
      error.name = 'NetworkError';
    }
    throw error;
  }
  return <div data-testid="success-component">Success!</div>;
};

describe('AsyncErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  it('should render children when no error occurs', () => {
    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByTestId('success-component')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should catch and display generic errors', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} errorType="generic" />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should detect and handle network errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} errorType="network" />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/trouble connecting to our servers/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show offline status when network is unavailable', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set navigator offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} errorType="network" />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    expect(screen.getByText(/check your internet connection/)).toBeInTheDocument();
    // Check for wifi-off icon (there are multiple, so use getAllByTestId)
    expect(screen.getAllByTestId('wifi-off-icon').length).toBeGreaterThan(0);
    expect(screen.getByText('Offline')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show online status when network is available', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} errorType="network" />
      </AsyncErrorBoundary>
    );

    // Check for wifi icon (there may be multiple, so use getAllByTestId)
    expect(screen.getAllByTestId('wifi-icon').length).toBeGreaterThan(0);
    expect(screen.getByText('Connected')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle retry functionality', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRetry = vi.fn().mockResolvedValue();

    render(
      <AsyncErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    expect(retryButton).toHaveTextContent('Retrying...');

    // Wait for the 1 second delay in handleRetry to complete
    await waitFor(
      () => {
        expect(onRetry).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );

    consoleSpy.mockRestore();
  });

  it('should disable retry button when offline for network errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set navigator offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} errorType="network" />
      </AsyncErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeDisabled();

    consoleSpy.mockRestore();
  });

  it('should call onError callback when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <AsyncErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );

    consoleSpy.mockRestore();
  });

  it('should render fallback action when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fallbackAction = {
      label: 'Go Home',
      onClick: vi.fn()
    };

    render(
      <AsyncErrorBoundary fallbackAction={fallbackAction}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const fallbackButton = screen.getByText('Go Home');
    expect(fallbackButton).toBeInTheDocument();

    fireEvent.click(fallbackButton);
    expect(fallbackAction.onClick).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('should use custom title and message when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary
        title="Custom Error Title"
        message="Custom error message"
      >
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show retry count when retries have been attempted', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    // Initial error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByText('Try Again'));

    // Wait for the retry cycle to complete:
    // 1. Button shows "Retrying..."
    // 2. After timeout, error state clears
    // 3. Children re-render and throw again
    // 4. Error boundary catches it with retryCount = 1
    await waitFor(
      () => {
        expect(screen.getByText('Retry attempts: 1')).toBeInTheDocument();
      },
      { timeout: 2000 } // Increased timeout to account for 1s delay in handleRetry
    );

    consoleSpy.mockRestore();
  });

  it('should handle online/offline status changes', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} errorType="network" />
      </AsyncErrorBoundary>
    );

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    fireEvent(window, new Event('offline'));

    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    fireEvent(window, new Event('online'));

    expect(screen.getByText('Connected')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should show error details in development mode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Error Details (Dev Mode)')).toBeInTheDocument();

    // Restore environment
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should clean up event listeners on unmount', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    removeEventListenerSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});