import React from 'react';
import type { FieldApi } from '@tanstack/react-form';

export interface FormFieldProps {
  field: FieldApi<unknown, unknown, unknown, unknown>;
  label: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField wrapper for TanStack Form fields
 * Handles label, error display, and helper text automatically
 *
 * @example
 * <form.Field name="email" validators={{...}}>
 *   {(field) => (
 *     <FormField field={field} label="Email" required>
 *       <Input {...field} />
 *     </FormField>
 *   )}
 * </form.Field>
 */
const FormField: React.FC<FormFieldProps> = ({
  field,
  label,
  required = false,
  helperText,
  children,
  className = '',
}) => {
  const hasError = field.state.meta.errors.length > 0;

  return (
    <div className={className}>
      <label
        htmlFor={field.name as string}
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {children}

      {hasError && (
        <p className="mt-1 text-sm text-red-400">
          {field.state.meta.errors[0]}
        </p>
      )}

      {!hasError && helperText && (
        <p className="mt-2 text-xs text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';

export { FormField };
