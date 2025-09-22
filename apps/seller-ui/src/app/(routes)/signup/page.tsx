'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SignUpForm } from '../../../components/forms/signup-form';
import { VerifyOtpForm } from '../../../components/forms/verify-otp-form';
import { ProtectedRoute } from '../../../components/auth/protected-route';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [email, setEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const handleSuccess = (
    userEmail: string,
    userName: string,
    userPassword: string
  ) => {
    setEmail(userEmail);
    setShowOtp(true);
  };

  const handleVerificationSuccess = () => {
    router.push('/login');
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <main className="w-full flex flex-col justify-center min-h-screen bg-ui-muted/50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto w-full">
          {/* Stepper */}
          <div className="relative flex items-center justify-between w-full px-4 mb-6">
            <div className="absolute top-5 left-[15%] right-[15%] h-0.5 bg-gray-300 -z-10" />
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm ${
                    step <= activeStep ? 'bg-brand-primary' : 'bg-gray-300'
                  } relative z-10`}
                >
                  {step}
                </div>
                <span className="text-xs sm:text-sm mt-3 text-center leading-tight px-1">
                  {step === 1
                    ? 'Create Account'
                    : step === 2
                    ? 'Setup Shop'
                    : 'Connect Bank'}
                </span>
              </div>
            ))}
          </div>

          {/* Steps Content */}
          <div className="w-full bg-ui-muted shadow rounded-lg">
            <div className="p-4 sm:p-6">
              {activeStep === 1 && (
                <>
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
                </>
              )}

              {/* Login link */}
              <div className="mt-4 text-center">
                <p className="text-sm text-text-secondary">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-brand-primary hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
