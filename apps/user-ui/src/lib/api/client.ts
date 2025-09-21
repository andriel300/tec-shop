import axios from 'axios';
import { extractSafeErrorMessage } from '../utils/error-handler';

// Use relative URL in production for security (prevents CSRF and reduces attack surface)
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'  // Relative URL - assumes frontend and API are served from same domain in production
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token (fallback to localStorage for backward compatibility)
apiClient.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    // Only add Authorization header if we have a token in localStorage (fallback/legacy)
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
        // Attempt to refresh the token
        await apiClient.post('/auth/refresh');

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear token and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfile');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
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