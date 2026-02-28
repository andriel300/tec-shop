import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

// Validate admin session using refresh endpoint
const fetchAdmin = async (): Promise<AdminUser | null> => {
  // First check sessionStorage for cached admin data
  const cachedAdmin = sessionStorage.getItem('admin');
  if (cachedAdmin) {
    return JSON.parse(cachedAdmin);
  }

  // Try to refresh the session - this validates if admin is logged in
  try {
    const response = await apiClient.post('/auth/refresh', null, {
      skipAuthRefresh: true,
    } as Record<string, unknown>);
    if (response.data?.userType === 'admin' && response.data?.user) {
      const admin = response.data.user;
      sessionStorage.setItem('admin', JSON.stringify(admin));
      return admin;
    }
    return null;
  } catch {
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
