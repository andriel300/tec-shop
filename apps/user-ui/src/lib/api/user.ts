import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  bio?: string;
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
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/user/me');
  return response.data;
};

export const getUserProfile = async (userId?: string): Promise<UserProfile> => {
  const endpoint = userId ? `/user/profile/${userId}` : '/user/profile/me';
  const response = await apiClient.get(endpoint);
  return response.data;
};

export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await apiClient.put('/user/profile', data);
  return response.data;
};