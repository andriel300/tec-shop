/* eslint-disable @nx/enforce-module-boundaries */
'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { ProtectedRoute } from '../../../../components/auth/protected-route';
import CreateShop from '../../../../shared/modules/auth/create-shop';
import { StripeIcon } from '../../../../assets/svgs/stripe-logo';
import { Button } from '../../../../components/ui/core/Button';
import { PhoneInput, validatePhoneNumber } from '../../../../components/ui/core/PhoneInput';
import { Select } from '../../../../components/ui/core/Select';
import { CreditCard, CheckCircle, Shield } from 'lucide-react';
import {
  createStripeOnboardingLink,
  getStripeAccountStatus,
} from '../../../../lib/api/seller';
import { upgradeToSeller } from '../../../../lib/api/auth';
import { apiClient } from '../../../../lib/api/client';
import { getCountryOptions } from '../../../../lib/data/countries';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Link, useRouter } from 'apps/seller-ui/src/i18n/navigation';

const USER_UI_URL = process.env.NEXT_PUBLIC_USER_UI_URL || 'http://localhost:3000';

function BecomeSellerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [countryError, setCountryError] = useState('');

  const countryOptions = getCountryOptions();

  // Handle Stripe success/error from URL parameters
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') {
      toast.success('Stripe account connected successfully!');
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe');
      window.history.replaceState({}, '', url.toString());
    } else if (stripeStatus === 'error') {
      toast.error('Failed to connect Stripe account. Please try again.');
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Check current auth status
  const { data: refreshData, isLoading: isCheckingAuth, isError: isAuthError } = useQuery({
    queryKey: ['become-seller-auth-check'],
    queryFn: async () => {
      const response = await apiClient.post('/auth/refresh', { userType: 'seller' }, {
        skipAuthRefresh: true,
      } as Record<string, unknown>);
      return response.data as { userType: string; user: Record<string, unknown> };
    },
    retry: false,
  });

  // Redirect seller to dashboard
  useEffect(() => {
    if (refreshData?.userType === 'seller') {
      router.replace('/dashboard');
    }
  }, [refreshData, router]);

  // Check Stripe account status
  const { data: stripeStatus, isLoading: isLoadingStripeStatus } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: getStripeAccountStatus,
    enabled: activeStep === 3,
    retry: false,
  });

  // Stripe onboarding mutation
  const { mutate: startStripeOnboarding, isPending: isCreatingOnboardingLink } = useMutation({
    mutationFn: createStripeOnboardingLink,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start Stripe onboarding');
    },
  });

  // Upgrade to seller mutation
  const { mutate: doUpgrade, isPending: isUpgrading } = useMutation({
    mutationFn: upgradeToSeller,
    onSuccess: () => {
      toast.success('Account upgraded to seller!');
      setActiveStep(2);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Upgrade failed. Please try again.');
    },
  });

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    const phoneValidationError = validatePhoneNumber(phoneNumber);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      valid = false;
    } else {
      setPhoneError('');
    }

    if (!country) {
      setCountryError('Please select a country');
      valid = false;
    } else {
      setCountryError('');
    }

    if (!valid) return;

    doUpgrade({ phoneNumber, country, currentPassword: currentPassword || undefined });
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    );
  }

  // Unauthenticated screen
  if (isAuthError || !refreshData) {
    return (
      <ProtectedRoute requireAuth={false}>
        <main className="w-full flex flex-col justify-center min-h-screen bg-gradient-to-br from-brand-primary-50 via-white to-brand-accent-50 px-4 py-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto w-full">
            <div className="w-full bg-white shadow-elev-lg rounded-lg border border-ui-divider p-6 sm:p-8 text-center space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Start Selling on TecShop</h1>
                <p className="text-text-secondary mt-2">
                  You need an account to become a seller. Sign in or create one to continue.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={`${USER_UI_URL}/login`}
                  className="block w-full bg-brand-primary hover:bg-brand-primary-600 text-white font-semibold py-3 px-4 rounded-md transition-colors text-center"
                >
                  Sign in
                </a>
                <a
                  href={`${USER_UI_URL}/signup`}
                  className="block w-full border border-brand-primary text-brand-primary hover:bg-brand-primary-50 font-semibold py-3 px-4 rounded-md transition-colors text-center"
                >
                  Create account
                </a>
              </div>

              <p className="text-sm text-text-secondary">
                Already a seller?{' '}
                <Link href="/login" className="font-medium text-brand-primary hover:underline">
                  Log in here
                </Link>
              </p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <main className="w-full flex flex-col justify-center min-h-screen bg-gradient-to-br from-brand-primary-50 via-white to-brand-accent-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto w-full">
          {/* Stepper */}
          <div className="relative flex items-center justify-between w-full px-4 mb-6">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-brand-primary transition-all duration-500"
              style={{ width: activeStep === 1 ? '0%' : activeStep === 2 ? '50%' : '100%' }}
            />
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1 relative">
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
                  {step === 1 ? 'Seller Details' : step === 2 ? 'Setup Shop' : 'Connect Bank'}
                </span>
              </div>
            ))}
          </div>

          {/* Steps Content */}
          <div className="w-full bg-white shadow-elev-lg rounded-lg border border-ui-divider">
            <div className="p-4 sm:p-6">
              {activeStep === 1 && (
                <form onSubmit={handleUpgradeSubmit} className="space-y-5">
                  <div className="text-center mb-3">
                    <h1 className="text-2xl font-bold text-text-primary">Become a Seller</h1>
                    <p className="text-sm text-text-secondary mt-2">
                      Add your phone number and country to start selling
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Phone Number
                    </label>
                    <PhoneInput
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder="Enter phone number"
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Country
                    </label>
                    <Select
                      options={countryOptions}
                      value={country}
                      onChange={setCountry}
                      placeholder="Select your country"
                    />
                    {countryError && (
                      <p className="mt-1 text-xs text-red-600">{countryError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full border border-ui-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Enter your account password"
                    />
                    <p className="mt-1 text-xs text-text-secondary">
                      Leave empty if you signed up with Google.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? 'Upgrading account...' : 'Continue'}
                  </Button>
                </form>
              )}

              {activeStep === 2 && <CreateShop setActiveStep={setActiveStep} />}

              {activeStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary">
                      Connect Your Stripe Account
                    </h2>
                    <p className="text-text-secondary max-w-md mx-auto">
                      Connect with Stripe to start accepting payments from customers securely
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-text-primary">Secure Payments</h3>
                        <p className="text-sm text-text-secondary">Industry-leading security with PCI compliance</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-text-primary">Fast Payouts</h3>
                        <p className="text-sm text-text-secondary">Get paid quickly with automatic transfers to your bank</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-text-primary">Global Reach</h3>
                        <p className="text-sm text-text-secondary">Accept payments from customers worldwide</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      className="w-full bg-[#635BFF] hover:bg-[#5A56E8] text-white py-3 text-base font-semibold"
                      onClick={() => startStripeOnboarding()}
                      disabled={isCreatingOnboardingLink || isLoadingStripeStatus}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span>
                          {isCreatingOnboardingLink
                            ? 'Creating onboarding link...'
                            : stripeStatus?.status === 'COMPLETE'
                            ? 'Stripe Connected'
                            : stripeStatus?.status === 'PENDING' || stripeStatus?.status === 'INCOMPLETE'
                            ? 'Continue Stripe Setup'
                            : 'Connect with Stripe'}
                        </span>
                        {!isCreatingOnboardingLink && <StripeIcon className="h-6 w-6" />}
                      </div>
                    </Button>

                    {stripeStatus?.status !== 'COMPLETE' && (
                      <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                        Skip for now
                      </Button>
                    )}

                    {stripeStatus?.status === 'COMPLETE' && (
                      <Button className="w-full" onClick={() => router.push('/dashboard')}>
                        Continue to Dashboard
                      </Button>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Your data is secure</p>
                        <p className="text-blue-700">
                          We use bank-level encryption and never store your banking information.
                          Stripe handles all payment processing securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-text-secondary">
                    Already have a seller account?{' '}
                    <Link href="/login" className="font-medium text-brand-primary hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function BecomeSellerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <BecomeSellerPageContent />
    </Suspense>
  );
}
