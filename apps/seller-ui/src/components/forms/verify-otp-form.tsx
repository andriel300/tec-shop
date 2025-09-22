'use client';

import React, { useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { verifyEmail } from '../../lib/api/auth';
import { Button } from '../ui/core/Button';

interface VerifyOtpFormProps {
  email: string;
  onSuccess: () => void;
}

export function VerifyOtpForm({ email, onSuccess }: VerifyOtpFormProps) {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      toast.success('Email verified successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      otp: Array(6).fill(''), // store as array of digits
    },
    onSubmit: async ({ value }) => {
      const otp = value.otp.join('');
      mutate({ email, otp });
    },
  });

  // --- Handlers ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    i: number
  ) => {
    const val = e.target.value.replace(/\D/, ''); // only digits
    form.setFieldValue('otp', (prev) => {
      const newOtp = [...prev];
      newOtp[i] = val;
      return newOtp;
    });

    if (val && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number
  ) => {
    if (e.key === 'Backspace' && !form.state.values.otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData('Text')
      .slice(0, 6)
      .replace(/\D/g, '');
    if (pasteData.length === 6) {
      form.setFieldValue('otp', pasteData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="otp"
        validators={{
          onChange: ({ value }) => {
            const code = value.join('');
            if (code.length !== 6) return 'OTP must be 6 digits';
            if (!/^\d{6}$/.test(code)) return 'OTP must contain only numbers';
            return undefined;
          },
        }}
      >
        {(field) => (
          <div>
            <label className="block py-2 text-sm font-medium text-text-secondary">
              Verification Code
            </label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {Array(6)
                .fill(null)
                .map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      if (el) inputRefs.current[i] = el;
                    }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={field.state.value[i] || ''}
                    onChange={(e) => handleInputChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-12 text-center border rounded-md border-ui-divider focus:ring-brand-primary focus:border-brand-primary"
                  />
                ))}
            </div>
            {field.state.meta.errors.length > 0 ? (
              <em className="text-sm text-feedback-error">
                {field.state.meta.errors[0]}
              </em>
            ) : null}
          </div>
        )}
      </form.Field>

      {error && (
        <div className="p-3 text-sm text-center text-white bg-feedback-error rounded-md">
          {error.message}
        </div>
      )}

      <div>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              variant="default"
              type="submit"
              disabled={!canSubmit || isSubmitting || isPending}
              className="w-full"
            >
              {isSubmitting || isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
