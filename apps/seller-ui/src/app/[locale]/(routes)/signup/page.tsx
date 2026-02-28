/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { SignUpForm } from '../../../components/forms/signup-form';
import { VerifyOtpForm } from '../../../components/forms/verify-otp-form';
import { ProtectedRoute } from '../../../components/auth/protected-route';
import { useRouter } from '@/i18n/navigation';
import CreateShop from '../../../shared/modules/auth/create-shop';
import { StripeIcon } from '../../../assets/svgs/stripe-logo';
import { Button } from '../../../components/ui/core/Button';
import { CreditCard, CheckCircle, Shield } from 'lucide-react';
import {
  createStripeOnboardingLink,
  getStripeAccountStatus,
} from '../../../lib/api/seller';
import { loginUser } from '../../../lib/api/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  // Handle Stripe success/error from URL parameters
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') {
      toast.success('Stripe account connected successfully! 🎉');
      // Remove the parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe');
      window.history.replaceState({}, '', url.toString());
    } else if (stripeStatus === 'error') {
      toast.error('Failed to connect Stripe account. Please try again.');
      // Remove the parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Check Stripe account status
  const { data: stripeStatus, isLoading: isLoadingStripeStatus } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: getStripeAccountStatus,
    enabled: activeStep === 3,
    retry: false,
  });

  // Stripe onboarding mutation
  const { mutate: startStripeOnboarding, isPending: isCreatingOnboardingLink } =
    useMutation({
      mutationFn: createStripeOnboardingLink,
      onSuccess: (data) => {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to start Stripe onboarding');
      },
    });

  // Auto-login mutation after email verification
  const { mutate: autoLogin } = useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      toast.success('Logged in successfully!');
      setShowOtp(false);
      setActiveStep(2);
    },
    onError: (error: Error) => {
      toast.error('Auto-login failed. Please login manually.');
      router.push('/login');
    },
  });

  const handleSuccess = (
    userEmail: string,
    userName: string,
    userPassword: string
  ) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setShowOtp(true);
  };

  const handleVerificationSuccess = () => {
    // Auto-login after email verification
    autoLogin({ email, password, rememberMe: false });
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <main className="w-full flex flex-col justify-center min-h-screen bg-gradient-to-br from-brand-primary-50 via-white to-brand-accent-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto w-full">
          {/* Stepper */}
          <div className="relative flex items-center justify-between w-full px-4 mb-6">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-brand-primary transition-all duration-500"
              style={{
                width:
                  activeStep === 1 ? '0%' : activeStep === 2 ? '50%' : '100%',
              }}
            />
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="flex flex-col items-center flex-1 relative"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${
                    step < activeStep
                      ? 'bg-brand-primary text-white'
                      : step === activeStep
                      ? 'bg-brand-primary text-white shadow-lg ring-4 ring-brand-primary-200'
                      : 'bg-gray-200 text-gray-500'
                  } relative z-10`}
                >
                  {step < activeStep ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-3 text-center leading-tight px-1 font-medium transition-colors ${
                    step <= activeStep ? 'text-brand-primary' : 'text-gray-400'
                  }`}
                >
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
          <div className="w-full bg-white shadow-elev-lg rounded-lg border border-ui-divider">
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
                      onClick={() => startStripeOnboarding()}
                      disabled={
                        isCreatingOnboardingLink || isLoadingStripeStatus
                      }
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span>
                          {isCreatingOnboardingLink
                            ? 'Creating onboarding link...'
                            : stripeStatus?.status === 'COMPLETE'
                            ? 'Stripe Connected ✓'
                            : stripeStatus?.status === 'PENDING' ||
                              stripeStatus?.status === 'INCOMPLETE'
                            ? 'Continue Stripe Setup'
                            : 'Connect with Stripe'}
                        </span>
                        {!isCreatingOnboardingLink && (
                          <StripeIcon className="h-6 w-6" />
                        )}
                      </div>
                    </Button>

                    {stripeStatus?.status !== 'COMPLETE' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          router.push('/dashboard');
                        }}
                      >
                        Skip for now
                      </Button>
                    )}

                    {stripeStatus?.status === 'COMPLETE' && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          router.push('/dashboard');
                        }}
                      >
                        Continue to Dashboard
                      </Button>
                    )}
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
