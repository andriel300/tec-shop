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
        // First, try to load from sessionStorage (client-side only)
        if (typeof window === 'undefined') {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

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

        // If no sessionStorage data, try to validate/refresh the session from cookies
        // This handles cases where the browser was closed but cookies are still valid
        try {
          const { apiClient } = await import('../lib/api/client');
          const { getCurrentUser } = await import('../lib/api/user');

          // Try to refresh the token - this will validate the session
          // If successful, new tokens will be set in cookies
          const response = await apiClient.post('/auth/refresh');

          if (response.data) {
            // Session is valid, fetch the full user profile
            try {
              const userProfile = await getCurrentUser();

              const user: User = {
                id: userProfile.userId,
                email: '', // Will be filled from user profile if needed
                isEmailVerified: true,
                name: userProfile.name,
              };

              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user,
                userProfile,
              });

              // Store user data in sessionStorage
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('user', JSON.stringify(user));
                sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
              }
            } catch (profileError) {
              console.error('Failed to fetch user profile after token refresh:', profileError);

              // Fallback to minimal user if profile fetch fails
              const minimalUser: User = {
                id: '',
                email: '',
                isEmailVerified: true,
                name: '',
              };

              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: minimalUser,
                userProfile: null,
              });

              if (typeof window !== 'undefined') {
                sessionStorage.setItem('user', JSON.stringify(minimalUser));
              }
            }
          }
        } catch {
          // Refresh failed - user is not authenticated
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        // Clear corrupted data
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('userProfile');
        }
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = (user: User) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user', JSON.stringify(user));
    }

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
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userProfile');
    }

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      userProfile: null,
    });
  };

  const setUserProfile = (profile: UserProfile) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userProfile', JSON.stringify(profile));
    }
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
