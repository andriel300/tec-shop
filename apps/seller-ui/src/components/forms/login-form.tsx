'use client';

import { createLogger } from '@tec-shop/next-logger';
import React, { useState } from 'react';

const logger = createLogger('seller-ui:login-form');
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { toast } from 'sonner';
import { useRouter } from '../../i18n/navigation';
import { loginUser } from '../../lib/api/auth';
import { getSellerProfile } from '../../lib/api/seller';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../ui/core/Input';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const INPUT_DARK =
  'bg-[#1E253A] border-[#2A3347] text-slate-200 placeholder:text-gray-600 focus-visible:border-brand-primary-600 focus-visible:ring-brand-primary-600/20 focus-visible:ring-offset-0';

export function LoginForm() {
  const t = useTranslations('Auth');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: loginUser,
    onSuccess: async (_data) => {
      try {
        const sellerProfile = await getSellerProfile();

        const user = {
          id: sellerProfile.id,
          email: sellerProfile.email,
          isEmailVerified: sellerProfile.isVerified,
          name: sellerProfile.name,
        };

        login(user);
        queryClient.invalidateQueries({ queryKey: ['seller'] });
        toast.success(t('loginTitle') + ', ' + sellerProfile.name + '!');
        router.push('/dashboard');
      } catch (error) {
        logger.error('Failed to fetch seller profile:', { error });
        toast.success(t('loginTitle') + '!');
        router.push('/dashboard');
      }
    },
    onError: (error: Error | { message: string } | string) => {
      logger.error('Login error:', { error });

      let message = 'An unknown error occurred.';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error.message === 'string') {
        message = error.message;
      }

      toast.error(message);

      if (
        message === 'Invalid credentials.' ||
        message.toLowerCase().includes('invalid') ||
        message.toLowerCase().includes('credential')
      ) {
        setTimeout(() => {
          toast.info(t('checkSignup'));
        }, 1000);
      }
    },
  });

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      reset();
      const { email, password, rememberMe } = value;
      mutate({ email, password, rememberMe });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-5"
    >
      {/* Email */}
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => (!value ? t('emailRequired') : undefined),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <label
              htmlFor={field.name}
              className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest"
            >
              {t('emailAddress')}
            </label>
            <Input
              id={field.name}
              name={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="email@example.com"
              autoFocus
              className={INPUT_DARK}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-feedback-error">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Password */}
      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) =>
            !value ? t('passwordRequired') : undefined,
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <label
              htmlFor={field.name}
              className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest"
            >
              {t('passwordLabel')}
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
                className={`pr-10 ${INPUT_DARK}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-feedback-error">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between">
        <form.Field name="rememberMe">
          {(field) => (
            <div className="flex items-center gap-2">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                checked={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 rounded border-[#2A3347] bg-[#1E253A] text-brand-primary-600 focus:ring-brand-primary-600/20"
              />
              <label
                htmlFor={field.name}
                className="text-sm text-gray-400 cursor-pointer"
              >
                {t('rememberMe')}
              </label>
            </div>
          )}
        </form.Field>

        <Link
          href="/forgot-password"
          className="text-sm text-brand-primary-600 hover:text-blue-400 transition-colors"
        >
          {t('forgotPassword')}
        </Link>
      </div>

      {/* Inline API error */}
      {error && (
        <p className="text-xs text-center text-feedback-error">
          {error instanceof Error ? error.message : t('anErrorOccurred')}
        </p>
      )}

      {/* Submit */}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || isPending}
            className="w-full py-3.5 bg-brand-primary-600 hover:bg-brand-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting || isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('signingIn')}
              </>
            ) : (
              <>
                {t('signIn')}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
