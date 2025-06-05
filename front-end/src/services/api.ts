import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = getAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { refreshToken, refreshAccessToken, logout } = getAuthStore.getState();
        
        // If we have a refresh token, try to get a new access token
        if (refreshToken) {
          await refreshAccessToken(refreshToken);
          // Retry the original request with the new token
          return api(originalRequest);
        } else {
          // No refresh token, logout
          logout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If refreshing fails, logout
        const { logout } = getAuthStore.getState();
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.data) {
      // Try to extract the error message from the response
      const data = axiosError.response.data as Record<string, any>;
      if (data.detail) return data.detail;
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
    if (axiosError.message) return axiosError.message;
  }
  return 'An unexpected error occurred';
};

export default api;