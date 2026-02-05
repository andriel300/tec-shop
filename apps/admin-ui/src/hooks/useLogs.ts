import { useQuery } from '@tanstack/react-query';
import * as logsApi from '../lib/api/logs';

export const logKeys = {
  all: ['logs'] as const,
  lists: () => [...logKeys.all, 'list'] as const,
  list: (filters?: logsApi.LogQueryParams) =>
    [...logKeys.lists(), filters] as const,
  recent: (limit?: number) => [...logKeys.all, 'recent', limit] as const,
  stats: () => [...logKeys.all, 'stats'] as const,
  services: () => [...logKeys.all, 'services'] as const,
};

export function useLogs(params?: logsApi.LogQueryParams) {
  return useQuery({
    queryKey: logKeys.list(params),
    queryFn: () => logsApi.queryLogs(params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useRecentLogs(limit = 50) {
  return useQuery({
    queryKey: logKeys.recent(limit),
    queryFn: () => logsApi.getRecentLogs(limit),
    staleTime: 10 * 1000,
    gcTime: 60 * 1000,
  });
}

export function useLogStats() {
  return useQuery({
    queryKey: logKeys.stats(),
    queryFn: logsApi.getLogStats,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useLogServices() {
  return useQuery({
    queryKey: logKeys.services(),
    queryFn: logsApi.getServices,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
