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
      console.log('[AuthContext] Starting initialization...');
      try {
        // First, try to load from sessionStorage (client-side only)
        if (typeof window === 'undefined') {
          console.log('[AuthContext] Server-side, skipping initialization');
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // Check for Google OAuth redirect with user data in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth');
        const userDataParam = urlParams.get('user');

        if (authSuccess === 'success' && userDataParam) {
          console.log('[AuthContext] Google OAuth success detected');
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            const user: User = {
              id: userData.id,
              email: userData.email,
              isEmailVerified: true,
              name: userData.name,
              createdAt: userData.createdAt,
            };

            // Fetch user profile
            const { getCurrentUser } = await import('../lib/api/user');
            const userProfile = await getCurrentUser();

            // Update state
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user,
              userProfile,
            });

            // Save to sessionStorage
            sessionStorage.setItem('user', JSON.stringify(user));
            sessionStorage.setItem('userProfile', JSON.stringify(userProfile));

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('[AuthContext] Google OAuth login completed');
            return;
          } catch (error) {
            console.error('[AuthContext] Failed to process Google OAuth data:', error);
            // Continue with normal flow
          }
        }

        const userData = sessionStorage.getItem('user');
        const profileData = sessionStorage.getItem('userProfile');

        console.log('[AuthContext] SessionStorage check - user:', !!userData, 'profile:', !!profileData);

        if (userData) {
          const user = JSON.parse(userData);
          const userProfile = profileData ? JSON.parse(profileData) : null;

          console.log('[AuthContext] Loading from sessionStorage:', {
            userId: user.id,
            userName: user.name,
            hasProfile: !!userProfile
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
        console.log('[AuthContext] No sessionStorage, attempting token refresh...');
        try {
          const { apiClient } = await import('../lib/api/client');
          const { getCurrentUser } = await import('../lib/api/user');

          // Try to refresh the token - this will validate the session
          // If successful, new tokens will be set in cookies
          const response = await apiClient.post('/auth/refresh', {}, {
            skipAuthRefresh: true,
          } as Record<string, unknown>);

          console.log('[AuthContext] Token refresh response:', !!response.data);

          if (response.data?.user) {
            // Session is valid, fetch the full user profile
            console.log('[AuthContext] Fetching user profile...');
            try {
              const userProfile = await getCurrentUser();
              console.log('[AuthContext] User profile fetched:', {
                userId: userProfile.userId,
                name: userProfile.name
              });

              const user: User = {
                id: response.data.user.id,
                email: response.data.user.email,
                isEmailVerified: true,
                name: response.data.user.name || userProfile.name,
                createdAt: response.data.user.createdAt,
              };

              console.log('[AuthContext] Setting authenticated state');
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
                console.log('[AuthContext] User data saved to sessionStorage');
              }
            } catch (profileError) {
              console.error('[AuthContext] Failed to fetch user profile after token refresh:', profileError);

              // Fallback to minimal user from refresh response if profile fetch fails
              const minimalUser: User = {
                id: response.data.user.id,
                email: response.data.user.email,
                isEmailVerified: true,
                name: response.data.user.name || '',
                createdAt: response.data.user.createdAt,
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
          console.log('[AuthContext] Token refresh failed:', refreshError instanceof Error ? refreshError.message : 'Unknown error');
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth state:', error);
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
