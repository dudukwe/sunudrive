import api, { handleApiError } from './api';
import { File, FilePermissionResponse, FileComment, FileVersion, FileActivity } from '../types';

export interface UploadFileData {
  title: string;
  tags: string[];
  folder?: string | null;
  description?: string;
  file: File;
}

export const fileService = {

async getFiles(folderId?: string): Promise<File[]> {
  try {
    const url = folderId ? `/files/?folder=${folderId}` : '/files/';
    const response = await api.get<File[]>(url);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
},
  
  async getFileDetails(fileId: string): Promise<File> {
    try {
      const response = await api.get<File>(`/files/${fileId}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async uploadFile(data: FormData): Promise<File> {
    try {
      const response = await api.post<File>('/files/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  // Updated download method with proper authentication
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const response = await api.get(`/files/${fileId}/download/`, {
        responseType: 'blob',
      });
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  // Updated preview method with proper authentication
  async previewFile(fileId: string): Promise<void> {
    try {
      const response = await api.get(`/files/${fileId}/preview/`, {
        responseType: 'blob',
      });
      
      // Create blob URL and open in new tab
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      // Clean up the URL after a delay to ensure it loads
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  // Deprecated methods - keeping for backward compatibility
  getDownloadUrl(fileId: string): string {
    console.warn('getDownloadUrl is deprecated. Use downloadFile method instead.');
    return `${api.defaults.baseURL}/files/${fileId}/download/`;
  },
  
  getPreviewUrl(fileId: string): string {
    console.warn('getPreviewUrl is deprecated. Use previewFile method instead.');
    return `${api.defaults.baseURL}/files/${fileId}/preview/`;
  },
  
  async trashFile(fileId: string): Promise<void> {
    try {
      await api.post(`/files/${fileId}/trash/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async restoreFile(fileId: string): Promise<void> {
    try {
      await api.post(`/files/${fileId}/restore/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async deleteFile(fileId: string): Promise<void> {
    try {
      await api.delete(`/files/${fileId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async toggleFavorite(fileId: string): Promise<{ is_favorite: boolean }> {
    try {
      const response = await api.post<{ is_favorite: boolean }>(`/files/${fileId}/favorite/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async shareFile(fileId: string, email: string, accessLevel: 'view' | 'edit' | 'admin'): Promise<void> {
    try {
      await api.post(`/files/${fileId}/share/`, { email, access_level: accessLevel });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
    
  async getFilePermissions(fileId: string): Promise<FilePermissionResponse> {
    try {
      const response = await api.get<FilePermissionResponse>(`/files/${fileId}/permissions/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getComments(fileId: string): Promise<FileComment[]> {
    try {
      const response = await api.get<FileComment[]>(`/files/${fileId}/comments/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async addComment(fileId: string, text: string): Promise<FileComment> {
    try {
      const response = await api.post<FileComment>(`/files/${fileId}/comments/`, { text });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getVersions(fileId: string): Promise<FileVersion[]> {
    try {
      const response = await api.get<FileVersion[]>(`/files/${fileId}/versions/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getActivity(fileId: string): Promise<FileActivity[]> {
    try {
      const response = await api.get<FileActivity[]>(`/files/${fileId}/activity/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getTrashedFiles(): Promise<File[]> {
    try {
      const response = await api.get<File[]>('/trash/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async emptyTrash(): Promise<void> {
    try {
      await api.delete('/trash/empty/');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
  
  async getRecentFiles(): Promise<File[]> {
    try {
      const response = await api.get<File[]>('/recent/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getSharedFiles(): Promise<File[]> {
    try {
      const response = await api.get('/shared/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Favorite files methods
  async getFavoriteFiles(): Promise<File[]> {
    try {
      const response = await api.get('/favorites/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async addToFavorites(fileId: string): Promise<void> {
    try {
      await api.post('/favorites/', { file_id: fileId });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async removeFromFavorites(fileId: string): Promise<void> {
    try {
      await api.delete(`/favorites/${fileId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};