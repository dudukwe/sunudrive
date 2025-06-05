from typing import List, Dict, Optional, Any, Literal, TypedDict
from datetime import datetime

# Define common types for the application

# User types
class UserDict(TypedDict):
    id: str
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_staff: bool

# File and document types
FileType = Literal['pdf', 'image', 'video', 'document', 'other']
ActionType = Literal['upload', 'download', 'view', 'edit', 'share', 'delete', 'restore', 'version', 'comment', 'favorite', 'unfavorite']
AccessLevel = Literal['view', 'edit', 'admin']

class FilePermissionDict(TypedDict):
    user_id: str
    access_level: AccessLevel
    granted_at: datetime
    granted_by: str

class FileVersionDict(TypedDict):
    id: str
    file_path: str
    version_number: int
    size: int
    created_at: datetime
    created_by: str

class CommentDict(TypedDict):
    id: str
    user_id: str
    text: str
    created_at: datetime
    updated_at: datetime

class FileActivityDict(TypedDict):
    id: str
    user_id: str
    action: ActionType
    timestamp: datetime
    details: Dict[str, Any]

class FileDict(TypedDict):
    id: str
    title: str
    type: FileType
    description: Optional[str]
    author: str
    tags: List[str]
    file_path: str
    original_filename: str
    size: int
    owner_id: str
    folder: Optional[str]
    uploaded_at: datetime
    updated_at: datetime
    last_opened: Optional[datetime]
    is_favorite: bool
    is_trashed: bool
    trashed_at: Optional[datetime]
    permissions: List[FilePermissionDict]
    versions: List[FileVersionDict]
    comments: List[CommentDict]
    activities: List[FileActivityDict]

# Notification types
NotificationType = Literal['share', 'comment', 'edit', 'system']

class NotificationDict(TypedDict):
    id: str
    user_id: str
    type: NotificationType
    message: str
    file: Optional[str]
    created_at: datetime
    is_read: bool
    read_at: Optional[datetime]
    details: Dict[str, Any]

# Folder types
class FolderDict(TypedDict):
    id: str
    name: str
    owner_id: str
    parent_folder: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_trashed: bool
    trashed_at: Optional[datetime]
    permissions: List[FilePermissionDict]

# Statistics types
class FileStatisticsDict(TypedDict):
    total_files: int
    total_size: int
    files_by_type: Dict[FileType, int]
    storage_by_type: Dict[FileType, int]
    recent_activity: List[Dict[str, Any]]