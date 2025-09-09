'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GoogleLoginButton } from 'apps/user-ui/src/components/ui/google-login-button';
import { LoginForm } from 'apps/user-ui/src/components/forms/login-form';
import { OtpForm } from 'apps/user-ui/src/components/forms/otp-form';

type AuthView = 'password' | 'otp';

export default function LoginPage() {
  const [view, setView] = useState<AuthView>('password');

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-ui-muted/50 py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-ui-background rounded-lg shadow-elev-md">
        <div>
          <h1 className="text-2xl font-bold text-center font-heading text-text-primary">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-brand-primary hover:underline"
            >
              create an account
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <GoogleLoginButton />
        </div>

        <div className="flex items-center">
          <div className="flex-grow border-t border-ui-divider"></div>
          <span className="px-2 text-xs text-text-muted">OR CONTINUE WITH</span>
          <div className="flex-grow border-t border-ui-divider"></div>
        </div>

        {/* Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-ui-muted">
          <button
            onClick={() => setView('password')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              view === 'password'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-text-secondary hover:bg-white/50'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setView('otp')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              view === 'otp'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-text-secondary hover:bg-white/50'
            }`}
          >
            One-Time Password
          </button>
        </div>

        {/* Conditional Form */}
        <div>{view === 'password' ? <LoginForm /> : <OtpForm />}</div>
      </div>
    </main>
  );
}
