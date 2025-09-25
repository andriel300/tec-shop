'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SignUpForm } from '../../../components/forms/signup-form';
import { VerifyOtpForm } from '../../../components/forms/verify-otp-form';
import { ProtectedRoute } from '../../../components/auth/protected-route';
import { useRouter } from 'next/navigation';
import CreateShop from '../../../shared/modules/auth/create-shop';
import { StripeIcon } from '../../../assets/svgs/stripe-logo';
import { Button } from '../../../components/ui/core/Button';
import { CreditCard, CheckCircle, Shield } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(3);
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

              {activeStep === 2 && <CreateShop setActiveStep={setActiveStep} />}

              {activeStep === 3 && (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">
                      Connect Your Stripe Account
                    </h2>
                    <p className="text-text-secondary max-w-md mx-auto">
                      Connect with Stripe to start accepting payments from
                      customers securely
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-text-primary">
                          Secure Payments
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Industry-leading security with PCI compliance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-text-primary">
                          Fast Payouts
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Get paid quickly with automatic transfers to your bank
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-text-primary">
                          Global Reach
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Accept payments from customers worldwide
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connect Button */}
                  <div className="space-y-4">
                    <Button
                      className="w-full bg-[#635BFF] hover:bg-[#5A56E8] text-white py-3 text-base font-semibold"
                      onClick={() => {
                        // TODO: Implement Stripe Connect integration
                        console.log('Connecting to Stripe...');
                      }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span>Connect with Stripe</span>
                        <StripeIcon className="h-6 w-6" />
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // TODO: Skip for now, redirect to dashboard
                        router.push('/dashboard');
                      }}
                    >
                      Skip for now
                    </Button>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">
                          Your data is secure
                        </p>
                        <p className="text-blue-700">
                          We use bank-level encryption and never store your
                          banking information. Stripe handles all payment
                          processing securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
