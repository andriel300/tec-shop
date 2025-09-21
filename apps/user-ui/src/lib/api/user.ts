import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  name?: string; // Name from UserProfile
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