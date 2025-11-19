'use client';

import React, { useState, useEffect } from 'react';
import { Select } from './Select';
import { Input } from '@tec-shop/input';
import { getPhoneCodeOptions } from '../../../../lib/data/countries';

export interface PhoneInputProps {
  value?: string;
  onChange?: (phoneNumber: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  defaultCountryCode?: string;
}

export interface PhoneValue {
  countryCode: string;
  number: string;
  fullNumber: string;
}

// Phone number formatting patterns
const formatPhoneNumber = (
  phoneNumber: string,
  countryCode: string
): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Different formatting based on country code
  switch (countryCode) {
    case '+1': // US/Canada format: (123) 456-7890
      if (digits.length >= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
          6,
          10
        )}`;
      } else if (digits.length >= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
          6
        )}`;
      } else if (digits.length >= 3) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      }
      return digits;

    case '+44': // UK format: 0123 456 7890
      if (digits.length >= 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(
          7,
          11
        )}`;
      } else if (digits.length >= 7) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      } else if (digits.length >= 4) {
        return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      }
      return digits;

    case '+33': // France format: 01 23 45 67 89
    case '+49': // Germany format: 030 12345678
      if (digits.length >= 8) {
        return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(
          4,
          6
        )} ${digits.slice(6, 8)} ${digits.slice(8)}`;
      } else if (digits.length >= 6) {
        return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(
          4,
          6
        )} ${digits.slice(6)}`;
      } else if (digits.length >= 4) {
        return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
      } else if (digits.length >= 2) {
        return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      }
      return digits;

    case '+55': // Brazil format: (11) 99999-9999
      if (digits.length >= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
          7,
          11
        )}`;
      } else if (digits.length >= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
          7
        )}`;
      } else if (digits.length >= 2) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      }
      return digits;

    default: // International format: 123 456 7890
      if (digits.length >= 9) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      } else if (digits.length >= 6) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      } else if (digits.length >= 3) {
        return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      }
      return digits;
  }
};

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = '',
      onChange,
      onBlur,
      placeholder = 'Enter phone number',
      disabled,
      className = '',
      id,
      name,
      defaultCountryCode = '+1',
    },
    ref
  ) => {
    const [countryCode, setCountryCode] = useState(defaultCountryCode);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isClient, setIsClient] = useState(false);

    const phoneCodeOptions = getPhoneCodeOptions();

    // Ensure client-side rendering to avoid hydration mismatches
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Parse initial value
    useEffect(() => {
      if (value) {
        // Try to extract country code from full number
        const matchedCountry = phoneCodeOptions.find((option) =>
          value.startsWith(option.value)
        );

        if (matchedCountry) {
          setCountryCode(matchedCountry.value);
          const localNumber = value.substring(matchedCountry.value.length);
          const formattedNumber = formatPhoneNumber(
            localNumber,
            matchedCountry.value
          );
          setPhoneNumber(formattedNumber);
        } else {
          // If no country code match, format with current country code
          const formattedNumber = formatPhoneNumber(value, countryCode);
          setPhoneNumber(formattedNumber);
        }
      } else {
        setPhoneNumber('');
      }
    }, [value, phoneCodeOptions, countryCode]);

    const handleCountryCodeChange = (newCountryCode: string) => {
      setCountryCode(newCountryCode);

      // Reformat the existing phone number with the new country code
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      const formattedNumber = formatPhoneNumber(digitsOnly, newCountryCode);
      setPhoneNumber(formattedNumber);

      const fullNumber = newCountryCode + digitsOnly;
      onChange?.(fullNumber);
    };

    const handlePhoneNumberChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      // Get only the digits from the input
      const inputValue = e.target.value;
      const digitsOnly = inputValue.replace(/\D/g, '');

      // Limit the number of digits based on country
      let maxDigits = 15; // Default max
      if (countryCode === '+1') maxDigits = 10; // US/Canada
      else if (countryCode === '+44') maxDigits = 11; // UK
      else if (countryCode === '+55') maxDigits = 11; // Brazil

      const limitedDigits = digitsOnly.slice(0, maxDigits);

      // Format the phone number based on country code
      const formattedNumber = formatPhoneNumber(limitedDigits, countryCode);
      setPhoneNumber(formattedNumber);

      // For the onChange callback, send the clean number with country code
      const fullNumber = countryCode + limitedDigits;
      onChange?.(fullNumber);
    };

    // Prevent hydration mismatches by only rendering after client-side hydration
    if (!isClient) {
      return (
        <div className={`flex gap-2 ${className}`}>
          <div className="w-32">
            <div className="w-full px-3 py-2 bg-ui-muted border border-ui-divider rounded-md text-text-muted">
              Loading...
            </div>
          </div>
          <div className="flex-1">
            <div className="w-full px-3 py-2 bg-ui-muted border border-ui-divider rounded-md text-text-muted">
              {placeholder}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex gap-2 ${className}`}>
        <div className="w-24 sm:w-28 md:w-32 flex-shrink-0">
          <Select
            options={phoneCodeOptions}
            value={countryCode}
            onChange={handleCountryCodeChange}
            placeholder="Code"
            disabled={disabled}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Input
            ref={ref}
            id={id}
            name={name}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

// Utility function to validate phone numbers
export const validatePhoneNumber = (
  phoneNumber: string
): string | undefined => {
  if (!phoneNumber) return 'Phone number is required';

  // Extract just the digits (excluding country code)
  const phoneMatch = phoneNumber.match(/^\+(\d{1,4})(.+)$/);
  if (!phoneMatch) {
    return 'Phone number must include country code';
  }

  const countryCode = phoneMatch[1];
  const localNumber = phoneMatch[2].replace(/\D/g, '');

  // Validate local number length
  if (localNumber.length < 7) {
    return 'Phone number must be at least 7 digits';
  }

  if (localNumber.length > 15) {
    return 'Phone number must be no more than 15 digits';
  }

  // Country-specific validation
  switch (`+${countryCode}`) {
    case '+1': // US/Canada should be exactly 10 digits
      if (localNumber.length !== 10) {
        return 'US/Canada phone numbers must be 10 digits';
      }
      break;
    case '+44': // UK numbers typically 10-11 digits
      if (localNumber.length < 10 || localNumber.length > 11) {
        return 'UK phone numbers must be 10-11 digits';
      }
      break;
    case '+33': // France typically 9 digits
    case '+49': // Germany typically 10-11 digits
      if (localNumber.length < 8 || localNumber.length > 11) {
        return 'Phone number length is invalid for this country';
      }
      break;
    default:
      // For other countries, allow 7-15 digits
      break;
  }

  return undefined;
};

