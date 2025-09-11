'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GoogleLoginButton } from '../../../components/ui/google-login-button';
import { SignUpForm } from '../../../components/forms/signup-form';
import { OtpForm } from '../../../components/forms/otp-form';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleSuccess = (email: string, name: string, pass: string) => {
    setEmail(email);
    setName(name);
    setPassword(pass);
    setShowOtp(true);
  };

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-ui-muted/50 py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-ui-muted rounded-lg shadow-elev-lg border border-ui-divider">
        <div>
          <h1 className="text-2xl font-bold text-center font-heading text-text-primary">
            {showOtp ? 'Verify your email' : 'Sign up'}
          </h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            {showOtp ? (
              `An OTP has been sent to ${email}`
            ) : (
              'Join the largest online community of technology on the Marketplace'
            )}
          </p>
          <p className="mt-2 text-sm text-center text-text-secondary">
            <>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-brand-primary hover:underline"
              >
                Log in
              </Link>
            </>
          </p>
        </div>
        {!showOtp && (
          <>
            <div className="flex items-center">
              <div className="flex-grow border-t border-ui-divider"></div>
              <span className="px-2 text-xs text-text-muted">OR SIGN UP WITH</span>
              <div className="flex-grow border-t border-ui-divider"></div>
            </div>
            <div className="space-y-4">
              <GoogleLoginButton />
            </div>
            <div className="flex items-center">
              <div className="flex-grow border-t border-ui-divider"></div>
              <span className="px-2 text-xs text-text-muted">OR SIGN UP WITH EMAIL</span>
              <div className="flex-grow border-t border-ui-divider"></div>
            </div>
          </>
        )}

        <div>
          {showOtp ? (
            <OtpForm
              flow="signup"
              email={email}
              name={name}
              password={password}
            />
          ) : (
            <SignUpForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </main>
  );
}
