import api, { handleApiError } from './api';
import { Folder } from '../types';

export interface CreateFolderData {
  name: string;
  parent_folder: string | null;
}

export const folderService = {
  async getFolders(parentFolder?: string): Promise<Folder[]> {
    try {
      const url = parentFolder ? `/folders/?parent_folder=${parentFolder}` : '/folders/';
      const response = await api.get<Folder[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getFolderDetails(folderId: string): Promise<Folder> {
    try {
      const response = await api.get<Folder>(`/folders/${folderId}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async createFolder(data: CreateFolderData): Promise<Folder> {
    try {
      const response = await api.post<Folder>('/folders/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async deleteFolder(folderId: string): Promise<void> {
    try {
      await api.delete(`/folders/${folderId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};