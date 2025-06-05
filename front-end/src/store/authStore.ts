import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import { authService } from '../services/authService';
import { jwtDecode } from 'jwt-decode';

interface AuthStore extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  refreshAccessToken: (refreshToken: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const getAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ identifier, password });
          set({
            user: response.user,
            accessToken: response.access,
            refreshToken: response.refresh,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to login',
          });
          throw error;
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.register(userData);
          // After registration, user needs to login
          set({
            isLoading: false,
          });
          return user;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to register',
          });
          throw error;
        }
      },
      
      refreshAccessToken: async (refreshToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.refreshToken(refreshToken);
          set({
            accessToken: response.access,
            refreshToken: response.refresh,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh token',
          });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },
      
      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

// Initialize auth state (check if token is valid on app load)
export const initializeAuth = async (): Promise<void> => {
  const { accessToken, refreshToken, refreshAccessToken, logout, isAuthenticated } = getAuthStore.getState();
  
  if (!isAuthenticated || !accessToken || !refreshToken) {
    return;
  }
  
  if (isTokenExpired(accessToken)) {
    if (isTokenExpired(refreshToken)) {
      // Both tokens expired, logout
      logout();
    } else {
      // Only access token expired, refresh it
      try {
        await refreshAccessToken(refreshToken);
      } catch {
        logout();
      }
    }
  } else {
    // Access token still valid, fetch user profile
    try {
      const user = await authService.getProfile();
      getAuthStore.getState().setUser(user);
    } catch {
      logout();
    }
  }
};