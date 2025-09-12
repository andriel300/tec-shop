import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      if (loading) {
        // Wait for AuthContext to finish its initial loading/checkAuth
        return;
      }

      if (success === 'true') {
        // If backend indicates success, re-check auth status (cookies should be set)
        await checkAuth();
        // After checkAuth, if authenticated, redirect to dashboard or success page
        if (isAuthenticated) {
          router.push('/dashboard'); // Redirect to your protected dashboard
        } else {
          // Fallback if checkAuth didn't immediately show authenticated
          router.push('/auth/success');
        }
      } else if (error) {
        // Redirect to error page with the error message
        router.push(`/auth/error?message=${error}`);
      } else {
        // If no success or error param, just re-check auth and redirect to home
        await checkAuth();
        router.push('/');
      }
    };

    handleCallback();
  }, [searchParams, router, checkAuth, isAuthenticated, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-background text-text-primary">
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-heading font-semibold mb-4">Processing Authentication...</h1>
        <p className="text-lg text-text-secondary">Please wait while we log you in.</p>
        {/* You can add a spinner or loading animation here */}
      </div>
    </div>
  );
}