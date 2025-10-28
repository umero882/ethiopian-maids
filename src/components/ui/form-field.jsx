import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { AlertCircle } from 'lucide-react';

const FormField = React.forwardRef(({
  className,
  label,
  required = false,
  error,
  helperText,
  children,
  id,
  ...props
}, ref) => {
  const fieldId = id || React.useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  // Combine aria-describedby values
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  // Clone children to add proper accessibility attributes
  const enhancedChild = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required ? 'true' : 'false',
        error: !!error,
        ...children.props,
      })
    : children;

  return (
    <div className={cn('space-y-2', className)} {...props} ref={ref}>
      {label && (
        <Label
          htmlFor={fieldId}
          required={required}
          error={!!error}
        >
          {label}
        </Label>
      )}

      {enhancedChild}

      {helperText && !error && (
        <p
          id={helperId}
          className="text-sm text-gray-600"
        >
          {helperText}
        </p>
      )}

      {error && (
        <div
          id={errorId}
          className="flex items-start gap-2 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export { FormField };