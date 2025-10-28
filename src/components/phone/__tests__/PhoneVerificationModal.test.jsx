/**
 * PhoneVerificationModal Component Tests
 * Tests for phone verification modal UI and user interactions
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneVerificationModal } from '../PhoneVerificationModal';
import phoneVerificationService from '@/services/phoneVerificationService';
import twilioService from '@/services/twilioService';
import * as AuthContext from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/services/phoneVerificationService', () => ({
  default: {
    startVerification: vi.fn(),
    verifyCode: vi.fn(),
    resendCode: vi.fn(),
  },
}));

vi.mock('@/services/twilioService', () => ({
  default: {
    validatePhoneNumber: vi.fn(),
    formatPhoneNumber: vi.fn(),
    maskPhoneNumber: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('PhoneVerificationModal', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({ user: mockUser });
  });

  describe('Rendering', () => {
    it('should render phone number input step when open', () => {
      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Verify Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Verification Code/i })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(
        <PhoneVerificationModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render country selector', () => {
      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByText('United States (+1)')).toBeInTheDocument();
      expect(screen.getByText('Ethiopia (+251)')).toBeInTheDocument();
    });

    it('should render SMS charges notice', () => {
      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('SMS Charges Apply')).toBeInTheDocument();
    });
  });

  describe('Phone Number Input', () => {
    it('should allow phone number input', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');

      expect(phoneInput.value).toBe('+12025551234');
    });

    it('should clean phone number input', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+1 (202) 555-1234');

      // Should remove non-digit characters except +
      expect(phoneInput.value).toBe('+12025551234');
    });

    it('should allow country selection', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const countrySelect = screen.getByLabelText('Country');
      await user.selectOptions(countrySelect, 'ET');

      expect(countrySelect.value).toBe('ET');
    });
  });

  describe('Sending Verification Code', () => {
    it('should send verification code successfully', async () => {
      const user = userEvent.setup();

      twilioService.validatePhoneNumber.mockReturnValue(true);
      phoneVerificationService.startVerification.mockResolvedValue({
        data: {
          verificationId: 'verification-123',
          phoneNumber: '+12025551234',
          maskedPhone: '+1 (XXX) XXX-1234',
        },
      });

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');

      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(phoneVerificationService.startVerification).toHaveBeenCalledWith(
          mockUser.id,
          '+12025551234'
        );
      });

      // Should move to step 2
      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      });
    });

    it('should show error for empty phone number', async () => {
      const user = userEvent.setup();
      const { toast } = await import('@/components/ui/use-toast');

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });
      await user.click(sendButton);

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Please enter a phone number',
          variant: 'destructive',
        })
      );
    });

    it('should show error for invalid phone format', async () => {
      const user = userEvent.setup();
      const { toast } = await import('@/components/ui/use-toast');

      twilioService.validatePhoneNumber.mockReturnValue(false);

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+invalid');

      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });
      await user.click(sendButton);

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Invalid phone number'),
          variant: 'destructive',
        })
      );
    });

    it('should handle API errors', async () => {
      const user = userEvent.setup();
      const { toast } = await import('@/components/ui/use-toast');

      twilioService.validatePhoneNumber.mockReturnValue(true);
      phoneVerificationService.startVerification.mockResolvedValue({
        error: { message: 'Phone number already in use' },
      });

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');

      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Phone number already in use',
            variant: 'destructive',
          })
        );
      });
    });

    it('should disable button while loading', async () => {
      const user = userEvent.setup();

      twilioService.validatePhoneNumber.mockReturnValue(true);
      phoneVerificationService.startVerification.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');

      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });
      await user.click(sendButton);

      expect(sendButton).toBeDisabled();
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });

  describe('Verification Code Input', () => {
    beforeEach(async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');
      phoneVerificationService.startVerification.mockResolvedValue({
        data: {
          verificationId: 'verification-123',
          phoneNumber: '+12025551234',
          maskedPhone: '+1 (XXX) XXX-1234',
        },
      });
    });

    it('should render code input step', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');

      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verify Code/i })).toBeInTheDocument();
    });

    it('should allow 6-digit code input', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      const codeInput = screen.getByLabelText('Verification Code');
      await user.type(codeInput, '123456');

      expect(codeInput.value).toBe('123456');
    });

    it('should only allow digits in code', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      const codeInput = screen.getByLabelText('Verification Code');
      await user.type(codeInput, 'abc123xyz');

      expect(codeInput.value).toBe('123');
    });

    it('should limit code to 6 digits', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      const codeInput = screen.getByLabelText('Verification Code');
      await user.type(codeInput, '1234567890');

      expect(codeInput.value).toBe('123456');
    });
  });

  describe('Verifying Code', () => {
    beforeEach(async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');
      phoneVerificationService.startVerification.mockResolvedValue({
        data: {
          verificationId: 'verification-123',
          phoneNumber: '+12025551234',
          maskedPhone: '+1 (XXX) XXX-1234',
        },
      });
    });

    it('should verify code successfully', async () => {
      const user = userEvent.setup();

      phoneVerificationService.verifyCode.mockResolvedValue({
        data: {
          success: true,
          phoneNumber: '+12025551234',
        },
      });

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      // Enter code
      const codeInput = screen.getByLabelText('Verification Code');
      await user.type(codeInput, '123456');

      // Verify
      const verifyButton = screen.getByRole('button', { name: /Verify Code/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(phoneVerificationService.verifyCode).toHaveBeenCalledWith(
          mockUser.id,
          '+12025551234',
          '123456'
        );
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error for invalid code', async () => {
      const user = userEvent.setup();
      const { toast } = await import('@/components/ui/use-toast');

      phoneVerificationService.verifyCode.mockResolvedValue({
        error: { message: 'Invalid code. 2 attempts remaining.' },
      });

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      // Enter code
      const codeInput = screen.getByLabelText('Verification Code');
      await user.type(codeInput, '999999');

      // Verify
      await user.click(screen.getByRole('button', { name: /Verify Code/i }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Invalid code. 2 attempts remaining.',
            variant: 'destructive',
          })
        );
      });
    });

    it('should disable verify button when code incomplete', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      const verifyButton = screen.getByRole('button', { name: /Verify Code/i });
      expect(verifyButton).toBeDisabled();

      // Enter incomplete code
      const codeInput = screen.getByLabelText('Verification Code');
      await user.type(codeInput, '123');

      expect(verifyButton).toBeDisabled();

      // Enter complete code
      await user.type(codeInput, '456');
      expect(verifyButton).not.toBeDisabled();
    });
  });

  describe('Resending Code', () => {
    beforeEach(async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');
      phoneVerificationService.startVerification.mockResolvedValue({
        data: {
          verificationId: 'verification-123',
          phoneNumber: '+12025551234',
          maskedPhone: '+1 (XXX) XXX-1234',
        },
      });
    });

    it('should show countdown timer for resend', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByText(/Resend in \d+s/)).toBeInTheDocument();
      });
    });

    it('should allow resend after countdown', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByText(/Resend in \d+s/)).toBeInTheDocument();
      });

      // Fast forward 60 seconds
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(screen.getByText('Resend code')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('should resend code successfully', async () => {
      const user = userEvent.setup();

      phoneVerificationService.resendCode.mockResolvedValue({
        data: {
          verificationId: 'verification-456',
          phoneNumber: '+12025551234',
          maskedPhone: '+1 (XXX) XXX-1234',
        },
      });

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      // Fast forward timer
      vi.useFakeTimers();
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(screen.getByText('Resend code')).toBeInTheDocument();
      });

      // Resend
      const resendButton = screen.getByText('Resend code');
      await user.click(resendButton);

      await waitFor(() => {
        expect(phoneVerificationService.resendCode).toHaveBeenCalledWith(
          mockUser.id,
          '+12025551234'
        );
      });

      vi.useRealTimers();
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      twilioService.validatePhoneNumber.mockReturnValue(true);
      twilioService.maskPhoneNumber.mockReturnValue('+1 (XXX) XXX-1234');
      phoneVerificationService.startVerification.mockResolvedValue({
        data: {
          verificationId: 'verification-123',
          phoneNumber: '+12025551234',
          maskedPhone: '+1 (XXX) XXX-1234',
        },
      });
    });

    it('should allow going back to phone number step', async () => {
      const user = userEvent.setup();

      render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Go to step 2
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');
      await user.click(screen.getByRole('button', { name: /Send Verification Code/i }));

      await waitFor(() => {
        expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      });

      // Go back
      const changeButton = screen.getByText('Change phone number');
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Verify Phone Number')).toBeInTheDocument();
      });
    });

    it('should reset state on close', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Enter phone
      const phoneInput = screen.getByLabelText('Phone Number');
      await user.type(phoneInput, '+12025551234');

      // Close modal
      rerender(
        <PhoneVerificationModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Reopen
      rerender(
        <PhoneVerificationModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Should be back to step 1 with empty form
      expect(screen.getByText('Verify Phone Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number').value).toBe('');
    });
  });
});
