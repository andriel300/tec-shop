import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
  {
    variants: {
      variant: {
        default: 'border-gray-300 text-text-primary',
        destructive: 'border-feedback-error text-text-primary',
        dark: 'bg-surface-container border-surface-container-highest text-gray-900 focus-visible:ring-brand-primary-600 focus-visible:ring-offset-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={textareaVariants({ variant, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
