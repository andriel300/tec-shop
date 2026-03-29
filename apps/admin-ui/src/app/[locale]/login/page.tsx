'use client';

import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import React, { useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import type { AxiosError } from 'axios';
import apiClient from '../../../lib/api/client';
import { useRouter } from '../../../i18n/navigation';
import { toast } from 'sonner';
import { Logo } from '../../../assets/svgs/logo';

type FormData = {
  email: string;
  password: string;
};

type LoginStep = 'credentials' | 'totp';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: 'Seller Management',
    desc: 'Verify and manage marketplace seller accounts',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Order Tracking',
    desc: 'Monitor and fulfill orders across all vendors',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Real-time Analytics',
    desc: 'Platform performance and revenue insights',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
    title: 'Product Catalog',
    desc: 'Moderate listings and control pricing rules',
  },
];

const LoginForm = () => {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  // SEC-10: validate redirect is a safe relative path to prevent open redirect
  const redirectPath = safeRedirect(searchParams.get('redirect'));
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<LoginStep>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const finishLogin = async () => {
    const refreshResponse = await apiClient.post('/auth/refresh', { userType: 'admin' }, {
      skipAuthRefresh: true,
    } as Record<string, unknown>);
    return refreshResponse.data;
  };

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const loginResponse = await apiClient.post('/auth/admin/login', data);
      if (loginResponse.data?.requiresTotp) {
        return { requiresTotp: true, tempToken: loginResponse.data.tempToken as string };
      }
      return finishLogin();
    },
    onSuccess: (data) => {
      setServerError(null);
      if (data.requiresTotp) {
        setTempToken(data.tempToken as string);
        setStep('totp');
        return;
      }
      if (data?.user) {
        sessionStorage.setItem('admin', JSON.stringify(data.user));
      }
      toast.success(`Welcome back, ${data?.user?.name ?? 'Admin'}!`);
      router.push(redirectPath);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message: string })?.message ??
        'Invalid Credentials!';
      setServerError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const totpMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient.post('/auth/admin/totp/verify', { tempToken, code });
      return finishLogin();
    },
    onSuccess: (data) => {
      setServerError(null);
      if (data?.user) {
        sessionStorage.setItem('admin', JSON.stringify(data.user));
      }
      toast.success(`Welcome back, ${data?.user?.name ?? 'Admin'}!`);
      router.push(redirectPath);
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message: string })?.message ??
        'Invalid authenticator code';
      setServerError(errorMessage);
      setTotpCode('');
      toast.error(errorMessage);
    },
  });

  const form = useForm({
    defaultValues: { email: '', password: '' } as FormData,
    onSubmit: async ({ value }) => {
      setServerError(null);
      loginMutation.mutate(value);
    },
  });

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length < 6) return;
    setServerError(null);
    totpMutation.mutate(totpCode);
  };

  // Auto-submit when 6 digits entered
  const handleTotpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setTotpCode(digits);
    if (digits.length === 6) {
      setServerError(null);
      totpMutation.mutate(digits);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080f1e]">

      {/* Left panel: Branding */}
      <div className="hidden lg:flex lg:w-[58%] flex-col relative overflow-hidden border-r border-slate-800/60">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">TecShop</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-widest bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full uppercase">
              Admin
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h2 className="text-[2.75rem] font-bold text-white leading-[1.15] mb-5 tracking-tight">
              Enterprise Admin<br />
              <span className="text-blue-400">Control Center</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-12">
              Full visibility and control over your multi-vendor marketplace. Manage sellers, orders, products, and platform analytics from one place.
            </p>

            <div className="space-y-5">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-none mb-1">{f.title}</p>
                    <p className="text-slate-500 text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-700 text-xs">
            TecShop Admin Console &nbsp;&bull;&nbsp; Authorized access only
          </p>
        </div>
      </div>

      {/* Right panel: Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[360px]">

          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">TecShop Admin</span>
          </div>

          {step === 'totp' ? (
            <>
              <div className="mb-7">
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setServerError(null); setTotpCode(''); }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-5 transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Back to login
                </button>
                <h1 className="text-2xl font-bold text-white mb-1.5">Two-factor verification</h1>
                <p className="text-slate-400 text-sm">Enter the 6-digit code from your authenticator app, or a backup code.</p>
              </div>

              <div className="flex items-center gap-2.5 mb-6 px-3.5 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-blue-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3M10.5 16.5h3" />
                </svg>
                <span className="text-xs text-blue-300">Open your authenticator app to get the code</span>
              </div>

              <form onSubmit={handleTotpSubmit}>
                <div className="mb-6">
                  <label htmlFor="totp-code" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Authenticator code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => handleTotpChange(e.target.value)}
                    disabled={totpMutation.isPending}
                    className="w-full bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-60"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {serverError && (
                  <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={totpMutation.isPending || totpCode.length < 6}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  {totpMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & sign in
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-600">
                Lost access to your authenticator? Use a backup code above.
              </p>
            </>
          ) : (
            <>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1.5">{t('welcomeAdmin')}</h1>
            <p className="text-slate-400 text-sm">Sign in to your admin console</p>
          </div>

          <div className="flex items-center gap-2.5 mb-6 px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-blue-400 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-xs text-slate-400">Secure administrator authentication</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
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
                <div className="mb-4">
                  <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t('email')}
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@tecshop.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-200"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                      </svg>
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => (!value ? t('passwordRequired') : undefined),
              }}
            >
              {(field) => (
                <div className="mb-6">
                  <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/70 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-150 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 flex-shrink-0">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                      </svg>
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {serverError && (
              <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg shadow-blue-600/20"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('signingIn')}
                </>
              ) : (
                <>
                  {t('login')}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-700 leading-relaxed">
            This system is restricted to authorized personnel only.
            <br />
            Unauthorized access attempts are logged and prosecuted.
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => (
  <Suspense>
    <LoginForm />
  </Suspense>
);

export default LoginPage;

/**
 * SEC-10: Validates that a redirect target is a safe relative path.
 * Rejects absolute URLs, protocol-relative URLs (//evil.com), and empty strings.
 */
function safeRedirect(path: string | null): string {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return '/dashboard';
}
