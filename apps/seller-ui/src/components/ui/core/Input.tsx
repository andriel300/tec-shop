import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:!text-gray-400 dark:placeholder:!text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-surface-container-highest text-gray-900 bg-surface-container',
        destructive: 'border-feedback-error text-gray-900 bg-surface-container',
        dark: 'bg-surface-container border-surface-container-highest text-gray-900 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <input
        className={inputVariants({ variant, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
