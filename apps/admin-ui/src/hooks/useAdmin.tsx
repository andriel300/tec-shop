import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import { useEffect } from 'react';
import { useRouter } from '../i18n/navigation';

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

// Validate admin session using refresh endpoint
// Always calls the server — sessionStorage is never used to skip JWT validation.
// React Query's staleTime (5 min) handles within-tab request deduplication.
const fetchAdmin = async (): Promise<AdminUser | null> => {
  try {
    const response = await apiClient.post('/auth/refresh', { userType: 'admin' }, {
      skipAuthRefresh: true,
    } as Record<string, unknown>);
    if (response.data?.userType === 'admin' && response.data?.user) {
      const admin = response.data.user;
      sessionStorage.setItem('admin', JSON.stringify(admin));
      return admin;
    }
    return null;
  } catch {
    sessionStorage.removeItem('admin');
    return null;
  }
};

const useAdmin = () => {
  const {
    data: admin,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin'],
    queryFn: fetchAdmin,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      sessionStorage.removeItem('admin');
      router.push('/');
    }
  }, [admin, router, isLoading]);

  return { admin, isLoading, isError, refetch };
};

export default useAdmin;
