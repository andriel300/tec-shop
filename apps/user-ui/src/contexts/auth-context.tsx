'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserProfile } from '../lib/api/user';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
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
    token: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        const profileData = localStorage.getItem('userProfile');

        if (token && userData) {
          const user = JSON.parse(userData);
          const userProfile = profileData ? JSON.parse(profileData) : null;

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            userProfile,
            token,
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        // Clear corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfile');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user,
      userProfile: null, // Will be loaded separately
      token,
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

    // Clear localStorage (for backward compatibility)
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');

    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      userProfile: null,
      token: null,
    });
  };

  const setUserProfile = (profile: UserProfile) => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setAuthState(prev => ({
      ...prev,
      userProfile: profile,
    }));
  };

  const updateAuthState = (updates: Partial<AuthState>) => {
    setAuthState(prev => ({
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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}