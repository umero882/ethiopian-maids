import { cn } from '@/lib/utils';
import React from 'react';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  // Generate unique ID for accessibility if not provided
  const id = props.id || React.useId();

  return (
    <input
      id={id}
      type={type}
      className={cn(
        // Base styles using design tokens
        'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2',
        'text-sm text-gray-900 placeholder:text-gray-500',
        'font-family-sans',
        // Height variants
        'h-10', // Default height from design tokens
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        'focus:border-purple-500',
        // Disabled states
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
        // File input styles
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-700',
        // High contrast support
        'contrast-more:border-gray-900 contrast-more:border-2',
        // Error state
        props.error && 'border-red-500 focus:ring-red-500',
        className
      )}
      ref={ref}
      // Enhanced accessibility attributes
      aria-invalid={props['aria-invalid'] || (props.error ? 'true' : 'false')}
      aria-describedby={props['aria-describedby']}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
