'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserProfile } from '../lib/api/user';
import { createLogger } from '@tec-shop/next-logger';

const logger = createLogger('user-ui:auth');

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
      logger.debug('Starting initialization...');
      try {
        // First, try to load from sessionStorage (client-side only)
        if (typeof window === 'undefined') {
          logger.debug('Server-side, skipping initialization');
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // Check for Google OAuth redirect — tokens are in httpOnly cookies, no user data in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth');

        if (authSuccess === 'success') {
          logger.debug('Google OAuth success detected');
          // Clean up URL immediately before any async work
          window.history.replaceState({}, document.title, window.location.pathname);
          // Fall through to the refresh flow below — cookies are already set
        }

        const userData = sessionStorage.getItem('user');
        const profileData = sessionStorage.getItem('userProfile');

        logger.debug('SessionStorage check', { hasUser: !!userData, hasProfile: !!profileData });

        if (userData) {
          const user = JSON.parse(userData);
          const userProfile = profileData ? JSON.parse(profileData) : null;

          logger.debug('Loading from sessionStorage', {
            userId: user.id,
            userName: user.name,
            hasProfile: !!userProfile,
          });

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
            userProfile,
          });
          return;
        }

        // If no sessionStorage data, try to validate/refresh the session from cookies
        // This handles cases where:
        // 1. Browser was closed but cookies are still valid
        // 2. User just logged in via Google OAuth and was redirected here
        // Note: We cannot check document.cookie for auth cookies because they're httpOnly
        // and set with path=/api. The browser will automatically send them with API requests.
        logger.debug('No sessionStorage, attempting token refresh...');
        try {
          const { performRefresh } = await import('../lib/api/client');
          const { getCurrentUser } = await import('../lib/api/user');

          // performRefresh uses a singleton Promise shared with the interceptor.
          // If the interceptor is already refreshing (or vice versa), both callers
          // await the same Promise — only one HTTP request fires — preventing the
          // race condition that would trigger refresh token reuse detection.
          const response = await performRefresh();

          logger.debug('Token refresh response', { hasData: !!response.data });

          if (response.data?.user) {
            // Session is valid, fetch the full user profile
            logger.debug('Fetching user profile...');
            try {
              const userProfile = await getCurrentUser();
              logger.debug('User profile fetched', {
                userId: userProfile.userId,
                name: userProfile.name,
              });

              const user: User = {
                id: response.data.user.id,
                email: response.data.user.email,
                isEmailVerified: true,
                name: response.data.user.name || userProfile.name,
                createdAt: response.data.user.createdAt,
                userType: response.data.userType,
              };

              logger.debug('Setting authenticated state');
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
                logger.debug('User data saved to sessionStorage');
              }
            } catch (profileError) {
              logger.error('Failed to fetch user profile after token refresh', { error: profileError });

              // Fallback to minimal user from refresh response if profile fetch fails
              const minimalUser: User = {
                id: response.data.user.id,
                email: response.data.user.email,
                isEmailVerified: true,
                name: response.data.user.name || '',
                createdAt: response.data.user.createdAt,
                userType: response.data.userType,
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
        } catch (refreshError) {
          // Refresh failed - user is not authenticated
          logger.debug('Token refresh failed', { error: refreshError instanceof Error ? refreshError.message : 'Unknown error' });
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        logger.error('Error initializing auth state', { error });
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
      logger.error('Logout API call failed', { error });
      // Continue with logout even if API call fails
    }

    // Clear only authentication-related storage
    // Keep cart, wishlist, and location data for better UX
    if (typeof window !== 'undefined') {
      // Clear sessionStorage (authentication state only)
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userProfile');

      // Note: We intentionally keep localStorage data:
      // - store-data (cart & wishlist) - users expect these to persist
      // - user_location - no need to re-fetch location on next login
      // - location_fetch_failed - retry tracker can stay
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
