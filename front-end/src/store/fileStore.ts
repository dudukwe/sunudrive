import { create } from 'zustand';
import { File, Folder } from '../types';
import { fileService } from '../services/fileService';
import { folderService } from '../services/folderService';

interface FileState {
  files: File[];
  folders: Folder[];
  currentFolder: Folder | null;
  folderPath: Folder[];
  currentFile: File | null;
  trashedFiles: File[];
  sharedFiles: File[];
  recentFiles: File[];
  favoriteFiles: File[]; // Ajouté
  isLoading: boolean;
  error: string | null;
}

interface FileStore extends FileState {
  fetchFiles: (folderId?: string) => Promise<void>;
  fetchFolders: (parentId?: string) => Promise<void>;
  fetchFolderDetails: (folderId: string) => Promise<void>;
  fetchFileDetails: (fileId: string) => Promise<void>;
  setCurrentFile: (file: File | null) => void;
  setCurrentFolder: (folder: Folder | null, updatePath?: boolean) => void;
  fetchTrashedFiles: () => Promise<void>;
  fetchSharedFiles: () => Promise<void>;
  fetchRecentFiles: () => Promise<void>;
  fetchFavoriteFiles: () => Promise<void>; // Ajouté
  uploadFile: (data: FormData) => Promise<File>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  toggleFavorite: (fileId: string) => Promise<void>;
  addToFavorites: (fileId: string) => Promise<void>; // Ajouté
  removeFromFavorites: (fileId: string) => Promise<void>; // Ajouté
  trashFile: (fileId: string) => Promise<void>;
  restoreFile: (fileId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  navigateToFolder: (folder: Folder | null) => Promise<void>;
  navigateUp: () => Promise<void>;
  addToFolderPath: (folder: Folder) => void;
  resetFolderPath: () => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  folders: [],
  currentFolder: null,
  folderPath: [],
  currentFile: null,
  trashedFiles: [],
  sharedFiles: [],
  recentFiles: [],
  favoriteFiles: [], // Ajouté
  isLoading: false,
  error: null,
  
fetchFiles: async (folderId) => {
  set({ isLoading: true, error: null });
  try {
    // CORRECTION : Filtrer les fichiers par dossier
    const files = folderId 
      ? await fileService.getFiles(folderId)  // Passer le folderId au service
      : await fileService.getFiles();         // Fichiers racine
    set({ files, isLoading: false });
  } catch (error) {
    set({ 
      isLoading: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch files' 
    });
  }
},
  
  fetchFolders: async (parentId) => {
    set({ isLoading: true, error: null });
    try {
      const folders = await folderService.getFolders(parentId || undefined);
      set({ folders, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch folders' 
      });
    }
  },
  
  fetchFolderDetails: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      const folder = await folderService.getFolderDetails(folderId);
      set({ currentFolder: folder, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch folder details' 
      });
    }
  },
  
  fetchFileDetails: async (fileId) => {
    set({ isLoading: true, error: null });
    try {
      const file = await fileService.getFileDetails(fileId);
      set({ currentFile: file, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch file details' 
      });
    }
  },
  
  setCurrentFile: (file) => {
    set({ currentFile: file });
  },
  
  setCurrentFolder: (folder, updatePath = true) => {
    set({ currentFolder: folder });
    if (updatePath && folder) {
      // Update path only if requested
      const { folderPath } = get();
      const existingIndex = folderPath.findIndex(f => f.id === folder.id);
      
      if (existingIndex >= 0) {
        // If folder is already in path, truncate the path up to this folder
        set({ folderPath: folderPath.slice(0, existingIndex + 1) });
      } else {
        // Add folder to path
        set({ folderPath: [...folderPath, folder] });
      }
    }
  },
  
  fetchTrashedFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await fileService.getTrashedFiles();
      set({ trashedFiles: files, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch trashed files' 
      });
    }
  },
  
  fetchSharedFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await fileService.getSharedFiles();
      set({ sharedFiles: files, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch shared files' 
      });
    }
  },
  
  fetchRecentFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await fileService.getRecentFiles();
      set({ recentFiles: files, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch recent files' 
      });
    }
  },
  
  // Nouvelle méthode pour récupérer les favoris
  fetchFavoriteFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await fileService.getFavoriteFiles();
      set({ favoriteFiles: files, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch favorite files' 
      });
    }
  },
  
  uploadFile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const file = await fileService.uploadFile(data);
      // Refresh files list
      await get().fetchFiles(get().currentFolder?.id);
      set({ isLoading: false });
      return file;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      });
      throw error;
    }
  },
  
  createFolder: async (name, parentId = null) => {
    set({ isLoading: true, error: null });
    try {
      const folder = await folderService.createFolder({
        name,
        parent_folder: parentId
      });
      
      // Refresh folders list
      await get().fetchFolders(parentId || undefined);
      
      set({ isLoading: false });
      return folder;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to create folder' 
      });
      throw error;
    }
  },
  
  toggleFavorite: async (fileId) => {
    try {
      const result = await fileService.toggleFavorite(fileId);
      
      // Update file in state
      const { files, currentFile, favoriteFiles } = get();
      const updatedFiles = files.map(file => 
        file.id === fileId ? { ...file, is_favorite: result.is_favorite } : file
      );
      
      // Update current file if it's the one being toggled
      const updatedCurrentFile = currentFile && currentFile.id === fileId 
        ? { ...currentFile, is_favorite: result.is_favorite } 
        : currentFile;
      
      // Update favorite files list
      const updatedFavoriteFiles = result.is_favorite 
        ? [...favoriteFiles, updatedFiles.find(f => f.id === fileId)!]
        : favoriteFiles.filter(file => file.id !== fileId);
      
      set({ 
        files: updatedFiles, 
        currentFile: updatedCurrentFile,
        favoriteFiles: updatedFavoriteFiles
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle favorite' 
      });
    }
  },
  
  // Nouvelle méthode pour ajouter aux favoris
  addToFavorites: async (fileId) => {
    try {
      await fileService.addToFavorites(fileId);
      
      // Update file in all relevant lists
      const { files, currentFile, sharedFiles, recentFiles } = get();
      
      const updateFileInList = (fileList: File[]) => 
        fileList.map(file => 
          file.id === fileId ? { ...file, is_favorite: true } : file
        );
      
      const updatedFiles = updateFileInList(files);
      const updatedSharedFiles = updateFileInList(sharedFiles);
      const updatedRecentFiles = updateFileInList(recentFiles);
      
      // Update current file if it's the one being updated
      const updatedCurrentFile = currentFile && currentFile.id === fileId 
        ? { ...currentFile, is_favorite: true } 
        : currentFile;
      
      set({ 
        files: updatedFiles,
        sharedFiles: updatedSharedFiles,
        recentFiles: updatedRecentFiles,
        currentFile: updatedCurrentFile
      });
      
      // Refresh favorites list
      await get().fetchFavoriteFiles();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add to favorites' 
      });
      throw error;
    }
  },
  
  // Nouvelle méthode pour retirer des favoris
  removeFromFavorites: async (fileId) => {
    try {
      await fileService.removeFromFavorites(fileId);
      
      // Update file in all relevant lists
      const { files, currentFile, sharedFiles, recentFiles, favoriteFiles } = get();
      
      const updateFileInList = (fileList: File[]) => 
        fileList.map(file => 
          file.id === fileId ? { ...file, is_favorite: false } : file
        );
      
      const updatedFiles = updateFileInList(files);
      const updatedSharedFiles = updateFileInList(sharedFiles);
      const updatedRecentFiles = updateFileInList(recentFiles);
      const updatedFavoriteFiles = favoriteFiles.filter(file => file.id !== fileId);
      
      // Update current file if it's the one being updated
      const updatedCurrentFile = currentFile && currentFile.id === fileId 
        ? { ...currentFile, is_favorite: false } 
        : currentFile;
      
      set({ 
        files: updatedFiles,
        sharedFiles: updatedSharedFiles,
        recentFiles: updatedRecentFiles,
        favoriteFiles: updatedFavoriteFiles,
        currentFile: updatedCurrentFile
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove from favorites' 
      });
      throw error;
    }
  },
  
  trashFile: async (fileId) => {
    try {
      await fileService.trashFile(fileId);
      
      // Remove file from current list
      const { files } = get();
      const updatedFiles = files.filter(file => file.id !== fileId);
      
      set({ files: updatedFiles });
      
      // Refresh trashed files
      await get().fetchTrashedFiles();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to trash file' 
      });
    }
  },
  
  restoreFile: async (fileId) => {
    try {
      await fileService.restoreFile(fileId);
      
      // Remove file from trash list
      const { trashedFiles } = get();
      const updatedTrashedFiles = trashedFiles.filter(file => file.id !== fileId);
      
      set({ trashedFiles: updatedTrashedFiles });
      
      // Refresh files
      await get().fetchFiles(get().currentFolder?.id);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to restore file' 
      });
    }
  },
  
  emptyTrash: async () => {
    set({ isLoading: true, error: null });
    try {
      await fileService.emptyTrash();
      set({ trashedFiles: [], isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to empty trash' 
      });
    }
  },
  
  deleteFile: async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      
      // Remove file from all lists
      const { files, trashedFiles } = get();
      const updatedFiles = files.filter(file => file.id !== fileId);
      const updatedTrashedFiles = trashedFiles.filter(file => file.id !== fileId);
      
      set({ files: updatedFiles, trashedFiles: updatedTrashedFiles });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete file' 
      });
    }
  },
  
  deleteFolder: async (folderId) => {
    try {
      await folderService.deleteFolder(folderId);
      
      // Remove folder from list
      const { folders } = get();
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      
      set({ folders: updatedFolders });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete folder' 
      });
    }
  },
  
  navigateToFolder: async (folder) => {
    set({ currentFolder: folder });
    
    // Add to path if not null
    if (folder) {
      get().addToFolderPath(folder);
    } else {
      get().resetFolderPath();
    }
    
    // Fetch content of the folder
    await get().fetchFolders(folder?.id || undefined);
    await get().fetchFiles(folder?.id);
  },
  
  navigateUp: async () => {
    const { folderPath } = get();
    
    if (folderPath.length <= 1) {
      // We're at root, navigate to null
      await get().navigateToFolder(null);
    } else {
      // Navigate to parent
      const parentFolder = folderPath[folderPath.length - 2];
      await get().navigateToFolder(parentFolder);
    }
  },
  
  addToFolderPath: (folder) => {
    const { folderPath } = get();
    const existingIndex = folderPath.findIndex(f => f.id === folder.id);
    
    if (existingIndex >= 0) {
      // If folder is already in path, truncate the path up to this folder
      set({ folderPath: folderPath.slice(0, existingIndex + 1) });
    } else {
      // Add folder to path
      set({ folderPath: [...folderPath, folder] });
    }
  },
  
  resetFolderPath: () => {
    set({ folderPath: [] });
  },
}));