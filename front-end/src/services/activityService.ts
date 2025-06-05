import api, { handleApiError } from './api';
import { FileActivity, Statistics, SearchResults } from '../types';

export const activityService = {
  async getAllActivity(): Promise<FileActivity[]> {
    try {
      const response = await api.get<FileActivity[]>('/activity/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getNotifications(): Promise<any> {
    try {
      const response = await api.get('/notifications/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async search(query: string): Promise<SearchResults> {
    try {
      const response = await api.get<SearchResults>(`/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getTags(): Promise<string[]> {
    try {
      const response = await api.get<string[]>('/tags/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getStatistics(): Promise<Statistics> {
    try {
      const response = await api.get<Statistics>('/statistics/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};