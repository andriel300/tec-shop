'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../lib/api/auth';
import { Button } from '../ui/core/Button';
import { Input } from '../ui/core/Input';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Login successful!');
      router.push('/'); // Redirect to dashboard or home
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
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
              placeholder="you@example.com"
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
              className="block py-2 text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                type={showPassword ? 'text' : 'password'}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="••••••••"
                className="pr-10" // Add padding for the toggle button
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
                className="w-4 h-4 rounded border-ui-surface-dark text-brand-primary focus:ring-brand-primary"
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
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
