'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { signupUser, API_BASE_URL } from '../../lib/api/auth';
import { Button } from '../ui/core/Button';
import { Input } from '../ui/core/Input';
import { Checkbox } from '../ui/core/Checkbox';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface SignUpFormProps {
  onSuccess: (email: string, name: string, pass: string) => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: signupUser,
    onSuccess: (data, variables) => {
      toast.success('OTP sent to your email!');
      onSuccess(variables.email, variables.name, variables.password || '');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
    onSubmit: async ({ value }) => {
      console.log(
        'NEXT_PUBLIC_BACKEND_URL:',
        process.env.NEXT_PUBLIC_BACKEND_URL
      );
      console.log('API_BASE_URL (from auth.ts):', API_BASE_URL);
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
        name="name"
        validators={{
          onChange: ({ value }) => (!value ? 'A name is required' : undefined),
        }}
      >
        {(field) => (
          <div>
            <label
              htmlFor={field.name}
              className="block py-2 text-sm font-medium text-text-secondary"
            >
              Name
            </label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter your name"
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
        name="password"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'A password is required';
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
                placeholder="Enter your Password"
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
            value !== form.getFieldValue('password')
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
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id={field.name}
                name={field.name}
                type={showConfirmPassword ? 'text' : 'password'}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="••••••••"
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

      <form.Field
        name="termsAccepted"
        validators={{
          onChange: ({ value }) =>
            !value ? 'You must accept the terms and conditions' : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <Checkbox
                id={field.name}
                name={field.name}
                checked={field.state.value}
                onCheckedChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
              />
              <div className="ml-3 text-sm">
                <label htmlFor={field.name} className="text-text-secondary">
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="text-brand-primary hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-brand-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
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
                  Signing up...
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
