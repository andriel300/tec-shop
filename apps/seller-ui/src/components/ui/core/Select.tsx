'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  flag?: string;
  key?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  variant?: 'default' | 'dark';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      onBlur,
      placeholder,
      disabled,
      className = '',
      id,
      name,
      variant = 'default',
    },
    ref
  ) => {
    const baseClasses = `
      w-full px-3 py-2 rounded-md
      focus:outline-none focus:ring-2 focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      appearance-none pr-10
    `;

    const variantClasses =
      variant === 'dark'
        ? 'bg-surface-container border border-surface-container-highest text-gray-900 focus:ring-brand-primary-600'
        : 'bg-surface-container border border-surface-container-highest text-gray-900 focus:ring-brand-primary-600';

    return (
      <div className="relative">
        <select
          ref={ref}
          id={id}
          name={name}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`${baseClasses} ${variantClasses} ${className}`}
          style={{
            fontFamily:
              '"Segoe UI", "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.key || option.value}
              value={option.value}
              style={{
                fontFamily:
                  '"Segoe UI", "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
              }}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
            'text-gray-500'
          }`}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
