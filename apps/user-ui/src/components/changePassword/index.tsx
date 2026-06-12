'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import apiClient from '../../lib/api/client';

const ChangePassword = () => {
  const t = useTranslations('ChangePassword');
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

        setMessage(t('successMessage'));
        form.reset();
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message ?? t('genericError'));
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
              !value ? t('currentPasswordRequired') : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {t('currentPassword')}
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
                ? t('newPasswordMinLength')
                : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {t('newPassword')}
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
                ? t('passwordsMismatch')
                : undefined,
          }}
        >
          {(field) => (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {t('confirmPassword')}
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
          {form.state.isSubmitting ? t('updating') : t('apply')}
        </button>
      </form>

      {/* Global Messages */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-500 text-sm">{message}</p>}
    </div>
  );
};

export default ChangePassword;
