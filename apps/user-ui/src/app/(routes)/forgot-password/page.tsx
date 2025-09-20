
'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requestPasswordReset } from '../../../lib/api/auth';
import { ProtectedRoute } from '../../../components/auth/protected-route';
import { Button } from '../../../components/ui/core/Button';
import { Input } from '../../../components/ui/core/Input';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      toast.success(
        'If an account with that email exists, a password reset link has been sent.'
      );
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      mutate(value);
    },
  });

  return (
    <ProtectedRoute requireAuth={false}>
      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-ui-muted/50 py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-ui-muted rounded-lg shadow-elev-lg border border-ui-divider">
        <div>
          <h1 className="text-2xl font-bold text-center font-heading text-text-primary">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            Enter your email address and we&apos;ll send you a link to reset your
            password.
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

          {error && (
            <div className="p-3 text-sm text-center text-white bg-feedback-error rounded-md">
              {error.message}
            </div>
          )}

          {isSuccess && (
            <div className="p-3 text-sm text-center text-white bg-feedback-success rounded-md">
              If an account with that email exists, a password reset link has
              been sent.
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
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
    </ProtectedRoute>
  );
}
