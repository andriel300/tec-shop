'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

function GoogleAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      if (loading) {
        return;
      }

      if (success === 'true') {
        if (isAuthenticated) {
          router.push('/dashboard');
        } else {
          router.push('/auth/success');
        }
      } else if (error) {
        router.push(`/auth/error?message=${error}`);
      } else {
        router.push('/');
      }
    };

    handleCallback();
  }, [searchParams, router, isAuthenticated, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-background text-text-primary">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-heading font-semibold mb-4">
          Processing Authentication...
        </h1>
        <p className="text-lg text-text-secondary">
          Please wait while we log you in.
        </p>
        {/* You can add a spinner or loading animation here */}
      </div>
    </div>
  );
}

export default function GoogleAuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleAuthCallbackContent />
    </Suspense>
  );
}