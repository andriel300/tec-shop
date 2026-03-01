'use client';

import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@tec-shop/input';
import type { AxiosError } from 'axios';
import apiClient from '../../lib/api/client';
import { useRouter } from '../../i18n/navigation';

type FormData = {
  email: string;
  password: string;
};

const Page = () => {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  // Mutation
  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Login sets the cookies
      await apiClient.post('/auth/admin/login', data);

      // Fetch admin data using refresh endpoint
      const refreshResponse = await apiClient.post('/auth/refresh', {}, {
        skipAuthRefresh: true,
      } as Record<string, unknown>);
      return refreshResponse.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      // Store admin data in sessionStorage
      if (data?.user) {
        sessionStorage.setItem('admin', JSON.stringify(data.user));
      }
      router.push('/dashboard');
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message: string })?.message ??
        'Invalid Credentials!';
      setServerError(errorMessage);
    },
  });

  // TanStack React Form
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as FormData,
    onSubmit: async ({ value }) => {
      setServerError(null);
      loginMutation.mutate(value);
    },
  });

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="md:w-[450px] pb-8 bg-slate-800 rounded-md shadow">
        <form
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <h1 className="text-3xl pb-3 pt-4 font-semibold text-center text-white font-heading">
            {t('welcomeAdmin')}
          </h1>

          {/* EMAIL FIELD */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? t('emailRequired')
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  ? t('invalidEmail')
                  : undefined,
            }}
          >
            {(field) => (
              <div className="mt-3">
                <Input
                  label={t('email')}
                  placeholder="support@tecshop.com"
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

          {/* PASSWORD */}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value ? t('passwordRequired') : undefined,
            }}
          >
            {(field) => (
              <div className="mt-3">
                <Input
                  label={t('password')}
                  type="password"
                  placeholder="********"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-5 text-xl flex justify-center font-semibold font-heading cursor-pointer bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loginMutation.isPending ? (
              <div className="w-6 h-6 border-2 border-gray-100 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>{t('login')}</>
            )}
          </button>

          {serverError && (
            <p className="text-red-500 text-sm mt-2">{serverError}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
