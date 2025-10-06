'use client';

import React from 'react';
import Link from 'next/link';
// import { GoogleLoginButton } from '../../../components/ui/google-login-button';
import { LoginForm } from '../../../components/forms/login-form';
// import { ProtectedRoute } from '../../../components/auth/protected-route';
export default function LoginPage() {
  return (
    <div>
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-primary-50 via-white to-brand-accent-50 py-12 px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-elev-lg border border-ui-divider">
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
            <LoginForm />
          </div>
          <div className="flex items-center">
            <div className="flex-grow border-t border-ui-divider"></div>
            <span className="px-2 text-xs text-text-muted">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow border-t border-ui-divider"></div>
          </div>
          <div className="space-y-4">{/* <GoogleLoginButton /> */}</div>
        </div>
      </main>
    </div>
  );
}
