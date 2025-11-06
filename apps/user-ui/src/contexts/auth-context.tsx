'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserProfile } from '../lib/api/user';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userProfile: UserProfile | null;
}

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  updateAuthState: (updates: Partial<AuthState>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    userProfile: null,
  });

  // Initialize auth state from sessionStorage or check authentication via API
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, try to load from sessionStorage
        const userData = sessionStorage.getItem('user');
        const profileData = sessionStorage.getItem('userProfile');

        if (userData) {
          const user = JSON.parse(userData);
          const userProfile = profileData ? JSON.parse(profileData) : null;

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            userProfile,
          });
          return;
        }

        // If no sessionStorage data, check if user is authenticated via cookies
        // by trying to fetch the user profile
        try {
          const { apiClient } = await import('../lib/api/client');
          // Use skipAuthRefresh flag to prevent infinite retry loops
          const response = await apiClient.get('/user', {
            skipAuthRefresh: true
          } as never);
          const userProfile = response.data;

          // If we got here, the user has valid auth cookies
          // Create a minimal user object from the profile
          const user: User = {
            id: userProfile.userId,
            email: '', // Will be populated from profile if available
            isEmailVerified: true,
            name: userProfile.name,
          };

          // Store in sessionStorage for future visits
          sessionStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('userProfile', JSON.stringify(userProfile));

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            userProfile,
          });
        } catch (apiError) {
          // No valid auth cookies or profile doesn't exist
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        // Clear corrupted data
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userProfile');
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = (user: User) => {
    sessionStorage.setItem('user', JSON.stringify(user));

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user,
      userProfile: null, // Will be loaded separately
    });
  };

  const logout = async () => {
    try {
      // Call the logout endpoint to clear the httpOnly cookie
      const { logoutUser } = await import('../lib/api/auth');
      await logoutUser();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }

    // Clear sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userProfile');

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      userProfile: null,
    });
  };

  const setUserProfile = (profile: UserProfile) => {
    sessionStorage.setItem('userProfile', JSON.stringify(profile));
    setAuthState((prev) => ({
      ...prev,
      userProfile: profile,
    }));
  };

  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    setUserProfile,
    updateAuthState,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
