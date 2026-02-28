'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { GoogleLoginButton } from '../../../components/ui/google-login-button';
import { SignUpForm } from '../../../components/forms/signup-form';
import { VerifyOtpForm } from '../../../components/forms/verify-otp-form';
import { ProtectedRoute } from '../../../components/auth/protected-route';
import { useRouter } from '@/i18n/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleSuccess = (userEmail: string, userName: string, userPassword: string) => {
    setEmail(userEmail);
    setShowOtp(true);
  };

  const handleVerificationSuccess = () => {
    router.push('/login');
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-ui-muted/50 py-12 px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-ui-muted rounded-lg shadow-elev-lg border border-ui-divider">
        <div>
          <h1 className="text-2xl font-bold text-center font-heading text-text-primary">
            {showOtp ? 'Verify your email' : 'Sign up'}
          </h1>
          <p className="mt-2 text-sm text-center text-text-secondary">
            {showOtp
              ? `An OTP has been sent to ${email}`
              : 'Join the largest online community of technology on the Marketplace'}
          </p>
        </div>
        {!showOtp && (
          <>
            <div className="flex items-center">
              <div className="flex-grow border-t border-ui-divider"></div>
              <span className="px-2 text-xs text-text-muted">
                OR SIGN UP WITH
              </span>
              <div className="flex-grow border-t border-ui-divider"></div>
            </div>
            <div className="space-y-4">
              <GoogleLoginButton buttonText="Sign up with Google" />
            </div>
          </>
        )}

        <div>
          {showOtp ? (
            <VerifyOtpForm
              email={email}
              onSuccess={handleVerificationSuccess}
            />
          ) : (
            <>
              <SignUpForm onSuccess={handleSuccess} />
            </>
          )}
        </div>
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
      </main>
    </ProtectedRoute>
  );
}
