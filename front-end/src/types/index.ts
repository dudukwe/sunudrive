export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cellphone: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FileVersion {
  id: string;
  file_path: string;
  version_number: number;
  size: number;
  created_at: string;
  created_by: string;
}

export interface FileComment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface FileActivity {
  id: string;
  user_id: string;
  action: 'upload' | 'view' | 'download' | 'share' | 'comment' | 'favorite' | 'unfavorite' | 'trash' | 'restore';
  timestamp: string;
  details?: Record<string, any>;
  file_id?: string;
  file_title?: string;
  username?: string;
  user_name?: string;
}

export interface FilePermission {
  user_id: string;
  access_level: 'view' | 'edit' | 'admin';
  granted_at: string;
  granted_by?: string;
  name?: string;
}

export interface FilePermissionResponse {
  owner: {
    user_id: string;
    name: string;
  };
  permissions: FilePermission[];
}

export interface File {
  id: string;
  title: string;
  type: string;
  description?: string;
  author: string;
  tags: string[];
  file_path?: string;
  original_filename?: string;
  size: number;
  owner_id?: string;
  folder?: string | null;
  uploaded_at: string;
  updated_at: string;
  last_opened?: string;
  is_favorite: boolean;
  is_trashed?: boolean;
  permissions?: FilePermission[];
  versions?: FileVersion[];
  comments?: FileComment[];
  activities?: FileActivity[];
}

export interface Folder {
  id: string;
  name: string;
  owner_id: string;
  parent_folder: string | null;
  created_at: string;
  updated_at: string;
  is_trashed: boolean;
  permissions: FilePermission[];
  subfolders?: Folder[];
}

export interface Statistics {
  total_files: number;
  total_size: number;
  files_by_type: Record<string, number>;
  storage_by_type: Record<string, number>;
  recent_activity: FileActivity[];
}

export interface SearchResults {
  count: number;
  results: File[];
}