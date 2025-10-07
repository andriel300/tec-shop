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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using cookies
        // Backend will read refresh_token from httpOnly cookie and set new cookies
        await apiClient.post('/auth/refresh');

        // Retry the original request (new access_token cookie will be used automatically)
        return apiClient(originalRequest);
      } catch {
        // Refresh failed, clear sessionStorage and redirect to login
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userProfile');
        window.location.href = '/login';
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
      console.error('Full error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Log validation errors if present
      if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
        console.error('Backend validation errors:');
        error.response.data.message.forEach((msg: string, idx: number) => {
          console.error(`  ${idx + 1}. ${msg}`);
        });
      }
    }

    return Promise.reject(new Error(safeMessage));
  }
);

export default apiClient;
