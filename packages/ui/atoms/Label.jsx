/**
 * Label Component
 *
 * Accessible form label with required indicator.
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const Label = forwardRef(function Label(
  { className, children, required, disabled, htmlFor, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={clsx(
        'block text-sm font-medium text-neutral-700',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
});

Label.displayName = 'Label';
