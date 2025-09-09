'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// API helper to request an OTP
async function generateOtp(values) {
  const res = await fetch('http://localhost:4000/api/v1/auth/otp/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to send OTP.');
  }
  return res.json();
}

// API helper to verify the OTP and log in
async function verifyOtp(values) {
  const res = await fetch('http://localhost:4000/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Invalid OTP.');
  }
  return res.json();
}

export function OtpForm() {
  const [email, setEmail] = useState('');
  const [formStage, setFormStage] = useState('generate'); // 'generate' or 'verify'
  const queryClient = useQueryClient();

  const generateOtpMutation = useMutation({
    mutationFn: generateOtp,
    onSuccess: (data, variables) => {
      setEmail(variables.email);
      setFormStage('verify');
      alert(data.message || 'An OTP has been sent to your email.');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      alert('Login successful!');
    },
  });

  const generateForm = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => generateOtpMutation.mutate(value),
  });

  const verifyForm = useForm({
    defaultValues: { email: email, otp: '' },
    onSubmit: async ({ value }) =>
      verifyOtpMutation.mutate({ ...value, email }),
  });

  if (formStage === 'verify') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          verifyForm.handleSubmit();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-center text-text-secondary">
          An OTP has been sent to <strong>{email}</strong>. Please enter it
          below.
        </p>
        <verifyForm.Field
          name="otp"
          validators={{
            onChange: ({ value }) => (!value ? 'OTP is required' : undefined),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-text-secondary"
              >
                One-Time Password
              </label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-md border-ui-divider focus:ring-brand-primary focus:border-brand-primary"
                placeholder="123456"
              />
              {field.state.meta.touchedErrors ? (
                <em className="text-sm text-feedback-error">
                  {field.state.meta.touchedErrors}
                </em>
              ) : null}
            </div>
          )}
        </verifyForm.Field>
        {verifyOtpMutation.error && (
          <div className="p-3 text-sm text-center text-white bg-feedback-error rounded-md">
            {verifyOtpMutation.error.message}
          </div>
        )}
        <button
          type="submit"
          disabled={verifyOtpMutation.isPending}
          className="w-full py-2 text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-primary-800 disabled:bg-gray-400"
        >
          {verifyOtpMutation.isPending ? 'Verifying...' : 'Sign In with OTP'}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        generateForm.handleSubmit();
      }}
      className="space-y-4"
    >
      <generateForm.Field
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
      </generateForm.Field>
      {generateOtpMutation.error && (
        <div className="p-3 text-sm text-center text-white bg-feedback-error rounded-md">
          {generateOtpMutation.error.message}
        </div>
      )}
      <button
        type="submit"
        disabled={generateOtpMutation.isPending}
        className="w-full py-2 text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-primary-800 disabled:bg-gray-400"
      >
        {generateOtpMutation.isPending ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </form>
  );
}
