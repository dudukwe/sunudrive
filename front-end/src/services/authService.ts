import api, { handleApiError } from './api';
import { User } from '../types';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterCredentials {
  cellphone: string;
  password: string;
  password2: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  refresh: string;
  access: string;
  user: User;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  cellphone?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login/', credentials);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async register(userData: RegisterCredentials): Promise<User> {
    try {
      const response = await api.post<User>('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh/', { refresh: refreshToken });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>('/auth/profile/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    try {
      const response = await api.put<User>('/auth/profile/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};