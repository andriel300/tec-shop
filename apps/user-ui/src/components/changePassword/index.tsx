'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import apiClient from '../../lib/api/client';

const ChangePassword = () => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      setError('');
      setMessage('');

      try {
        await apiClient.post('/auth/change-password', {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          confirmPassword: value.confirmPassword,
        });

        setMessage('Password changed successfully');
        form.reset();
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Something went wrong');
      }
    },
  });

  return (
    <div className="max-w-md mx-auto space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Current Password */}
        <form.Field
          name="currentPassword"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Current password is required' : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.[0] && (
                <p className="text-red-500 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* New Password */}
        <form.Field
          name="newPassword"
          validators={{
            onChange: ({ value }) =>
              value.length < 6
                ? 'New password must be at least 6 characters'
                : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.[0] && (
                <p className="text-red-500 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Confirm New Password */}
        <form.Field
          name="confirmPassword"
          validators={{
            onChange: ({ value, fieldApi }) =>
              value !== fieldApi.form.getFieldValue('newPassword')
                ? 'Passwords do not match'
                : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border px-3 py-2"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.[0] && (
                <p className="text-red-500 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Submit */}
        <button
          type="submit"
          disabled={form.state.isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          {form.state.isSubmitting ? 'Updating...' : 'Apply'}
        </button>
      </form>

      {/* Global Messages */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-500 text-sm">{message}</p>}
    </div>
  );
};

export default ChangePassword;
