'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GoogleLoginButton } from '../../../components/ui/google-login-button';
import { LoginForm } from '../../../components/forms/login-form';
import { OtpForm } from '../../../components/forms/otp-form';
import { Mail } from 'lucide-react';

type AuthView = 'password' | 'otp';

export default function LoginPage() {
  const [view, setView] = useState<AuthView>('password');

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-ui-muted/50 py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-ui-muted rounded-lg shadow-elev-lg border border-ui-divider">
        <div>
          <h1 className="text-2xl font-bold text-center font- text-text-primary">
            Log in to TecShop
          </h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            New to TecShop?{' '}
            <Link
              href="/signup"
              className="font-medium text-brand-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-md bg-ui-muted"></div>

        {/* Conditional Form */}
        <div>
          {view === 'password' ? <LoginForm /> : <OtpForm flow="login" />}
        </div>
        <div className="flex items-center">
          <div className="flex-grow border-t border-ui-divider"></div>
          <span className="px-2 text-xs text-text-muted">OR CONTINUE WITH</span>
          <div className="flex-grow border-t border-ui-divider"></div>
        </div>
        <div className="space-y-4">
          <GoogleLoginButton />
          <button
            onClick={() => setView('otp')}
            className="flex bg-brand-primary-50 items-center justify-center w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors text-text-primary hover:bg-ui-surface hover:text-text-primary border border-ui-divider"
          >
            <Mail className="h-4 w-4 mr-2" />
            <span>Continue with Email</span>
          </button>
        </div>
      </div>
    </main>
  );
}
