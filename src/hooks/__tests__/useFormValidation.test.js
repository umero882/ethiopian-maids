import { vi } from 'vitest';
/**
 * 🧪 Form Validation Hook Tests
 * Unit tests for form validation functionality
 */

import { renderHook, act } from '@testing-library/react';
import {
  useFormValidation,
  useRegistrationValidation,
  useMaidProfileValidation,
} from '../useFormValidation';

describe('useFormValidation', () => {
  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isValid).toBe(false);
      expect(result.current.isValidating).toBe(false);
    });

    it('should throw error for invalid schema name', () => {
      // Suppress console errors for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFormValidation('invalidSchema'));
      }).toThrow("Validation schema 'invalidSchema' not found");

      consoleSpy.mockRestore();
    });
  });

  describe('Field Validation', () => {
    it('should validate individual fields', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      await act(async () => {
        const isValid = await result.current.validateField(
          'email',
          'invalid-email'
        );
      });

      expect(result.current.hasFieldError('email')).toBe(true);
      expect(result.current.getFieldError('email')).toContain('valid email');
    });

    it('should clear field errors when valid', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      // First set an error
      await act(async () => {
        await result.current.validateField('email', 'invalid-email');
      });

      expect(result.current.hasFieldError('email')).toBe(true);

      // Then provide valid input
      await act(async () => {
        await result.current.validateField('email', 'valid@example.com');
      });

      expect(result.current.hasFieldError('email')).toBe(false);
    });

    it('should handle field touch state', () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      expect(result.current.isFieldTouched('email')).toBe(false);

      act(() => {
        result.current.touchField('email');
      });

      expect(result.current.isFieldTouched('email')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      const formData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        name: 'Test User',
        userType: 'sponsor',
      };

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateForm(formData);
      });

      expect(validationResult.isValid).toBe(true);
      expect(result.current.isValid).toBe(true);
    });

    it('should return errors for invalid form data', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      const invalidFormData = {
        email: 'invalid-email',
        password: '123', // Too short
        confirmPassword: '456', // Doesn't match
        name: '', // Required
        userType: 'invalid', // Invalid type
      };

      let validationResult;
      await act(async () => {
        validationResult = await result.current.validateForm(invalidFormData);
      });

      expect(validationResult.isValid).toBe(false);
      expect(Object.keys(validationResult.errors).length).toBeGreaterThan(0);
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    it('should handle blur events', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration', {
          validateOnBlur: true,
        })
      );

      await act(async () => {
        await result.current.handleBlur('email', 'test@example.com');
      });

      expect(result.current.isFieldTouched('email')).toBe(true);
    });

    it('should handle change events', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration', {
          validateOnChange: true,
          showErrorsImmediately: true,
        })
      );

      await act(async () => {
        await result.current.handleChange('email', 'invalid-email');
      });

      expect(result.current.hasFieldError('email')).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should clear all errors', () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      // Set some errors first
      act(() => {
        result.current.touchField('email');
      });

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isValid).toBe(false);
    });

    it('should clear specific field error', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      // Set an error
      await act(async () => {
        await result.current.validateField('email', 'invalid-email');
      });

      expect(result.current.hasFieldError('email')).toBe(true);

      // Clear the specific error
      act(() => {
        result.current.clearFieldError('email');
      });

      expect(result.current.hasFieldError('email')).toBe(false);
    });

    it('should reset validation state', () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      // Set some state
      act(() => {
        result.current.touchField('email');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isValid).toBe(false);
      expect(result.current.isValidating).toBe(false);
    });
  });

  describe('Specialized Hooks', () => {
    it('should work with registration validation hook', () => {
      const { result } = renderHook(() => useRegistrationValidation());

      expect(result.current.errors).toEqual({});
      expect(typeof result.current.validateForm).toBe('function');
    });

    it('should work with maid profile validation hook', () => {
      const { result } = renderHook(() => useMaidProfileValidation());

      expect(result.current.errors).toEqual({});
      expect(typeof result.current.validateForm).toBe('function');
    });
  });

  describe('Validation Options', () => {
    it('should respect validateOnChange option', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration', {
          validateOnChange: false,
        })
      );

      await act(async () => {
        await result.current.handleChange('email', 'invalid-email');
      });

      // Should not validate on change when option is false
      expect(result.current.hasFieldError('email')).toBe(false);
    });

    it('should respect validateOnBlur option', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration', {
          validateOnBlur: false,
        })
      );

      await act(async () => {
        await result.current.handleBlur('email', 'invalid-email');
      });

      // Should still touch the field but not validate
      expect(result.current.isFieldTouched('email')).toBe(true);
    });

    it('should call onValidationChange callback', async () => {
      const mockCallback = vi.fn();

      const { result } = renderHook(() =>
        useFormValidation('userRegistration', {
          onValidationChange: mockCallback,
        })
      );

      const formData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!',
        name: 'Test User',
        userType: 'sponsor',
      };

      await act(async () => {
        await result.current.validateForm(formData);
      });

      expect(mockCallback).toHaveBeenCalledWith(true, {});
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const { result } = renderHook(() =>
        useFormValidation('userRegistration')
      );

      // Mock a validation error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      await act(async () => {
        // This should not throw
        await result.current.validateField('email', null);
      });

      console.error = originalConsoleError;
    });
  });
});

