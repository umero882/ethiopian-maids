/**
 * Input Component
 *
 * Accessible, RTL-ready text input.
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';

const inputVariants = {
  default: 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
  success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
};

const sizeVariants = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-10 px-3 text-base',
  lg: 'h-12 px-4 text-lg',
};

export const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    variant = 'default',
    size = 'md',
    error,
    disabled,
    fullWidth,
    startAdornment,
    endAdornment,
    dir,
    ...props
  },
  ref
) {
  const finalVariant = error ? 'error' : variant;

  return (
    <div className={clsx('relative', fullWidth && 'w-full')}>
      {startAdornment && (
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2',
            dir === 'rtl' ? 'right-3' : 'left-3',
            'pointer-events-none text-neutral-500'
          )}
        >
          {startAdornment}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        dir={dir}
        disabled={disabled}
        className={clsx(
          'block rounded-md border bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          inputVariants[finalVariant],
          sizeVariants[size],
          startAdornment && (dir === 'rtl' ? 'pr-10' : 'pl-10'),
          endAdornment && (dir === 'rtl' ? 'pl-10' : 'pr-10'),
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
      {endAdornment && (
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2',
            dir === 'rtl' ? 'left-3' : 'right-3',
            'pointer-events-none text-neutral-500'
          )}
        >
          {endAdornment}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
