/**
 * 🛡️ Secure Form Component
 * Automatically includes CSRF protection and input validation
 */

import React, { forwardRef } from 'react';
import { useCSRFProtection } from '@/lib/csrfProtection';
import { cn } from '@/lib/utils';

/**
 * Secure Form component with built-in CSRF protection
 */
const SecureForm = forwardRef(
  (
    { onSubmit, children, className, validateOnSubmit = true, ...props },
    ref
  ) => {
    const { token, createProtectedHandler } = useCSRFProtection();

    // Create protected submit handler
    const handleSubmit = createProtectedHandler(async (formData, event) => {
      event.preventDefault();

      if (validateOnSubmit) {
        // Basic form validation
        const form = event.target;
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
      }

      // Call original onSubmit with protected data
      if (onSubmit) {
        await onSubmit(formData, event);
      }
    });

    return (
      <form
        ref={ref}
        onSubmit={(e) => {
          const formData = new FormData(e.target);
          const formObject = Object.fromEntries(formData.entries());
          handleSubmit(formObject, e);
        }}
        className={cn('space-y-4', className)}
        {...props}
      >
        {/* Hidden CSRF token field */}
        <input type='hidden' name='csrf_token' value={token} readOnly />

        {children}
      </form>
    );
  }
);

SecureForm.displayName = 'SecureForm';

/**
 * Secure Input component with built-in validation and sanitization
 */
const SecureInput = forwardRef(
  (
    {
      type = 'text',
      sanitize = true,
      maxLength,
      pattern,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleChange = (e) => {
      let value = e.target.value;

      if (sanitize) {
        // Basic input sanitization
        switch (type) {
          case 'email':
            // Remove potentially dangerous characters from email
            value = value.replace(/[<>'"]/g, '');
            break;
          case 'tel':
            // Only allow numbers, spaces, dashes, plus, and parentheses
            value = value.replace(/[^0-9\s\-\+\(\)]/g, '');
            break;
          case 'text':
          case 'textarea':
            // Remove script tags and other dangerous HTML
            value = value.replace(
              /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
              ''
            );
            value = value.replace(/javascript:/gi, '');
            value = value.replace(/on\w+\s*=/gi, '');
            break;
        }
      }

      // Apply maxLength if specified
      if (maxLength && value.length > maxLength) {
        value = value.substring(0, maxLength);
      }

      // Update the input value
      e.target.value = value;

      // Call original onChange
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        ref={ref}
        type={type}
        maxLength={maxLength}
        pattern={pattern}
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

SecureInput.displayName = 'SecureInput';

/**
 * Secure Textarea component
 */
const SecureTextarea = forwardRef(
  (
    { sanitize = true, maxLength = 5000, className, onChange, ...props },
    ref
  ) => {
    const handleChange = (e) => {
      let value = e.target.value;

      if (sanitize) {
        // Remove script tags and other dangerous HTML
        value = value.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ''
        );
        value = value.replace(/javascript:/gi, '');
        value = value.replace(/on\w+\s*=/gi, '');
      }

      // Apply maxLength
      if (value.length > maxLength) {
        value = value.substring(0, maxLength);
      }

      // Update the textarea value
      e.target.value = value;

      // Call original onChange
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <textarea
        ref={ref}
        maxLength={maxLength}
        onChange={handleChange}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

SecureTextarea.displayName = 'SecureTextarea';

export { SecureForm, SecureInput, SecureTextarea };
