'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { verifyEmail } from '../../lib/api/auth';
import { Button } from '../ui/core/Button';
import { Input } from '../ui/core/Input';

interface VerifyOtpFormProps {
  email: string;
  onSuccess: () => void;
}

export function VerifyOtpForm({ email, onSuccess }: VerifyOtpFormProps) {
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
      otp: '',
    },
    onSubmit: async ({ value }) => {
      mutate({ email, otp: value.otp });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="otp"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'OTP is required';
            if (value.length !== 6) return 'OTP must be 6 digits';
            if (!/^\d{6}$/.test(value)) return 'OTP must contain only numbers';
            return undefined;
          },
        }}
      >
        {(field) => (
          <div>
            <label
              htmlFor={field.name}
              className="block py-2 text-sm font-medium text-text-secondary"
            >
              Verification Code
            </label>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              autoFocus
            />
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