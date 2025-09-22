import { apiClient } from './client';

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyEmailData {
  email: string;
  otp: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface ResetPasswordWithCodeData {
  email: string;
  code: string;
  newPassword: string;
}

export interface ValidateResetTokenData {
  token: string;
}

export interface ValidateResetTokenResponse {
  valid: boolean;
  email: string;
}

export interface AuthResponse {
  access_token?: string; // Optional for backward compatibility with cookie-based auth
  message: string;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

// Auth API functions
export const signupUser = async (data: SignupData): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/signup', data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const verifyEmail = async (data: VerifyEmailData): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/verify-email', data);
  return response.data;
};

export const requestPasswordReset = async (data: ForgotPasswordData): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/forgot-password', data);
  return response.data;
};

export const validateResetToken = async (data: ValidateResetTokenData): Promise<ValidateResetTokenResponse> => {
  const response = await apiClient.post('/auth/validate-reset-token', data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordData): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};

export const resetPasswordWithCode = async (data: ResetPasswordWithCodeData): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/reset-password-with-code', data);
  return response.data;
};

export const logoutUser = async (): Promise<ApiResponse> => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

// Export API_BASE_URL for backward compatibility
export { API_BASE_URL } from './client';