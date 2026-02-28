'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

/**
 * Checkout Page - Redirects to Stripe Hosted Checkout
 *
 * With Stripe Checkout Sessions, users are redirected directly to Stripe's hosted
 * payment page. This page should never be reached in normal flow.
 *
 * If a user lands here, redirect them back to cart.
 */
const CheckoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to cart after a brief moment
    const timer = setTimeout(() => {
      router.push('/cart');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600 mb-2">Redirecting to checkout...</p>
        <p className="text-sm text-gray-500">
          If you are not redirected automatically,{' '}
          <button
            onClick={() => router.push('/cart')}
            className="text-blue-600 underline hover:text-blue-700"
          >
            click here
          </button>
          .
        </p>
      </div>
    </div>
  );
};

export default CheckoutPage;
