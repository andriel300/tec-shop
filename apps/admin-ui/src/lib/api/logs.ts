import { apiClient } from './client';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogCategory =
  | 'auth'
  | 'user'
  | 'seller'
  | 'product'
  | 'order'
  | 'system'
  | 'security'
  | 'payment';

export interface LogEntry {
  id: string;
  service: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  sellerId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  traceId?: string;
  ip?: string;
  userAgent?: string;
}

export interface LogQueryParams {
  service?: string;
  level?: LogLevel;
  category?: LogCategory;
  search?: string;
  userId?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogDownloadParams {
  service?: string;
  level?: LogLevel;
  category?: LogCategory;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface LogListResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface LogStats {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  byService: Record<string, number>;
}

export interface ServicesResponse {
  services: string[];
}

export const queryLogs = async (
  params: LogQueryParams = {}
): Promise<LogListResponse> => {
  const response = await apiClient.get('/logs', { params });
  return response.data;
};

export const getLogStats = async (): Promise<LogStats> => {
  const response = await apiClient.get('/logs/stats');
  return response.data;
};

export const getRecentLogs = async (
  limit = 50
): Promise<LogEntry[]> => {
  const response = await apiClient.get('/logs/recent', {
    params: { limit },
  });
  return response.data;
};

export const downloadLogs = async (
  params: LogDownloadParams = {}
): Promise<Blob> => {
  const response = await apiClient.get('/logs/download', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const getServices = async (): Promise<ServicesResponse> => {
  const response = await apiClient.get('/logs/services');
  return response.data;
};

export const downloadLogsAsFile = async (
  params: LogDownloadParams = {}
): Promise<void> => {
  const blob = await downloadLogs(params);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.download = `logs-${timestamp}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
