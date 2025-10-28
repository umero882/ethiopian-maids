import React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      required: {
        true: 'after:content-["*"] after:ml-1 after:text-red-500',
      },
      error: {
        true: 'text-red-600',
      },
    },
  }
);

const Label = React.forwardRef(({ className, required, error, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ required, error }), className)}
    {...props}
  >
    {children}
    {required && <span className="sr-only"> (required)</span>}
  </LabelPrimitive.Root>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
