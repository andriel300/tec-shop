import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api/client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// fecth admin data from API
const fetchAdmin = async () => {
  const response = await apiClient.get('/auth/login-admin');
  return response.data.user;
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
    retry: 1,
  });

  const history = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      history.push('/');
    }
  }, [admin, history, isLoading]);

  return { admin, isLoading, isError, refetch };
};

export default useAdmin;
