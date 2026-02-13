import axios from 'axios';
import { extractSafeErrorMessage } from '../utils/error-handler';

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

// Response interceptor for error handling and automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip auto-refresh for initial auth check to avoid infinite loops
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // Handle both 401 (Unauthorized) and 403 (Forbidden) for expired/invalid tokens
    // 403 can occur when RolesGuard rejects an expired token
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using cookies
        // Backend will read refresh_token from httpOnly cookie and set new cookies
        // skipAuthRefresh prevents infinite recursion if the refresh call itself fails with 401/403
        await apiClient.post('/auth/refresh', null, {
          skipAuthRefresh: true,
        } as Record<string, unknown>);

        // Retry the original request (new access_token cookie will be used automatically)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear sessionStorage
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userProfile');

        // Only redirect if not already on login/signup pages to avoid infinite loops
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
            window.location.href = '/login';
          }
        }

        return Promise.reject(
          new Error('Session expired. Please log in again.')
        );
      }
    }

    // Use the sophisticated error handler for secure message extraction
    const safeMessage = extractSafeErrorMessage(error);

    // In development, log the actual error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.data || error.message);
    }

    return Promise.reject(new Error(safeMessage));
  }
);

export default apiClient;
