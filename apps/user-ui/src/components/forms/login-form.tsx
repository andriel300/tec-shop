'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

// Helper function to call the login API
async function loginUser(values) {
  const res = await fetch('http://localhost:4000/api/v1/auth/login/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || 'Login failed. Please check your credentials.'
    );
  }

  return res.json();
}

export function LoginForm() {
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      alert('Login successful!');
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      // NOTE: To make "Remember Me" fully functional, the backend would need to accept
      // the `rememberMe` flag and adjust the refresh token's expiry accordingly.
      mutate(value);
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
              className="block text-sm font-medium text-text-secondary"
            >
              Email Address
            </label>
            <input
              id={field.name}
              name={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md border-ui-divider focus:ring-brand-primary focus:border-brand-primary"
              placeholder="you@example.com"
            />
            {field.state.meta.touchedErrors ? (
              <em className="text-sm text-feedback-error">
                {field.state.meta.touchedErrors}
              </em>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) =>
            !value ? 'A password is required' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md border-ui-divider focus:ring-brand-primary focus:border-brand-primary"
              placeholder="••••••••"
            />
            {field.state.meta.touchedErrors ? (
              <em className="text-sm text-feedback-error">
                {field.state.meta.touchedErrors}
              </em>
            ) : null}
          </div>
        )}
      </form.Field>

      <div className="flex items-center justify-between">
        <form.Field name="rememberMe">
          {(field) => (
            <div className="flex items-center">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                checked={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 rounded border-ui-divider text-brand-primary focus:ring-brand-primary"
              />
              <label
                htmlFor={field.name}
                className="ml-2 block text-sm text-text-secondary"
              >
                Remember me
              </label>
            </div>
          )}
        </form.Field>
        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-brand-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>

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
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full py-2 text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-primary-800 disabled:bg-gray-400"
            >
              {isSubmitting || isPending ? 'Signing In...' : 'Sign In'}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
