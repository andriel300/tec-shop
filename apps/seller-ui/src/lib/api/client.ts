import axios from 'axios';
import { createLogger } from '@tec-shop/next-logger';
import { extractSafeErrorMessage } from '../utils/error-handler';

const logger = createLogger('seller-ui:api-client');

// Use relative URL in production for security (prevents CSRF and reduces attack surface)
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/api' // Relative URL - assumes frontend and API are served from same domain in production
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - cookies are automatically sent with withCredentials: true
// No need to manually add Authorization header as httpOnly cookies handle authentication
apiClient.interceptors.request.use(
  (config) => {
    // Cookies (customer_access_token or seller_access_token) are automatically sent
    // by the browser with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import type { AxiosResponse } from 'axios';

// Shared refresh Promise — a single in-flight /auth/refresh request shared by
// all concurrent callers (interceptor + initializeAuth in auth-context).
// Returning the full AxiosResponse lets auth-context read user data from it
// without firing a second request.
let refreshPromise: Promise<AxiosResponse> | null = null;

/**
 * Performs a token refresh using the singleton guard.
 * Exported so auth-context.initializeAuth can share the same lock as the
 * interceptor, preventing a race where both fire /auth/refresh simultaneously
 * with the same token — which would trigger reuse detection and force a logout.
 *
 * All concurrent callers get back the same Promise, so only one HTTP request
 * is ever made per refresh cycle.
 */
export function performRefresh(): Promise<AxiosResponse> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh', { userType: 'seller' }, {
        skipAuthRefresh: true,
      } as Record<string, unknown>)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
      window.location.href = '/login';
    }
  }
}

// Response interceptor for error handling and automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip auto-refresh for calls that are already part of the refresh flow
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // Only refresh on 401 (Unauthorized / expired token).
    // 403 (Forbidden) means the token is valid but the role is wrong —
    // refreshing gives the same role and would cause an infinite redirect.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // performRefresh uses a shared Promise so concurrent 401s only fire
        // one /auth/refresh request; all other callers wait on the same Promise.
        await performRefresh();
        return apiClient(originalRequest);
      } catch {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userProfile');
        redirectToLogin();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    // Use the sophisticated error handler for secure message extraction
    const safeMessage = extractSafeErrorMessage(error);

    if (typeof window === 'undefined') {
      logger.error('API Error', {
        status: error.response?.status,
        message: error.message,
      });
    }

    return Promise.reject(new Error(safeMessage));
  }
);

export default apiClient;
