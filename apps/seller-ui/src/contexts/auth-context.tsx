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

  // Initialize auth state from sessionStorage (cookies handle authentication)
  useEffect(() => {
    const initializeAuth = () => {
      try {
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
        } else {
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: false,
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
          isAuthenticated: false,
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
