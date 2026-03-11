import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  name?: string; // Name from UserProfile
  createdAt?: string; // ISO date string from auth service
  userType?: string; // 'customer', 'seller', or 'admin' — from refresh response
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  bio?: string;
  picture?: string; // Google profile picture URL
  dateOfBirth?: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  avatar?: {
    id: string;
    url: string;
  };
}

// User API functions
export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await apiClient.get('/user');
  return response.data;
};

export const getUserProfile = async (userId?: string): Promise<UserProfile> => {
  // For now, we only support getting current user's profile
  // In the future, we can add support for getting other users' profiles
  const response = await apiClient.get('/user');
  return response.data;
};

export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await apiClient.patch('/user', data);
  return response.data;
};

export const uploadUserAvatar = async (file: File): Promise<{ url: string; fileId: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiClient.post<{ url: string; fileId: string }>(
    '/user/upload-avatar',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
};