'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { resetPassword } from '../../../lib/api/auth'; // Assuming this function exists
import { Button } from '../../../components/ui/core/Button';
import { Input } from '../../../components/ui/core/Input';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Password reset token is missing.');
      router.push('/forgot-password');
    }
  }, [token, router]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success('Your password has been reset successfully.');
      router.push('/login');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        toast.error('Password reset token is missing.');
        return;
      }
      mutate({ ...value, token });
    },
  });

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-ui-muted/50 py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-ui-muted rounded-lg shadow-elev-lg border border-ui-divider">
        <div>
          <h1 className="text-2xl font-bold text-center font-heading text-text-primary">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            Enter your email and new password.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value ? 'An email is required' : undefined,
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block py-2 text-sm font-medium text-text-secondary"
                >
                  Email Address
                </label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter your Email"
                />
                {field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-feedback-error">
                    {field.state.meta.errors[0]}
                  </em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'A new password is required';
                if (value.length < 8)
                  return 'Password must be at least 8 characters';
                if (!/(?=.*[a-z])/.test(value))
                  return 'Password must contain a lowercase letter';
                if (!/(?=.*[A-Z])/.test(value))
                  return 'Password must contain an uppercase letter';
                if (!/(?=.*\d)/.test(value))
                  return 'Password must contain a number';
                if (!/(?=.*[@$!%*?&])/.test(value))
                  return 'Password must contain a special character';
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
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? 'text' : 'password'}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter your new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-text-muted focus:outline-none"
                  >
                    {showPassword ? <Eye /> : <EyeOff />}
                  </button>
                </div>
                {field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-feedback-error">
                    {field.state.meta.errors[0]}
                  </em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value }) =>
                value !== form.getFieldValue('newPassword')
                  ? 'Passwords do not match'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block py-2 text-sm font-medium text-text-secondary"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Confirm your new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-text-muted focus:outline-none"
                  >
                    {showConfirmPassword ? <Eye /> : <EyeOff />}
                  </button>
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 8 8 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>

        <p className="mt-2 text-sm text-center text-text-secondary">
          <Link
            href="/login"
            className="font-medium text-brand-primary hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}