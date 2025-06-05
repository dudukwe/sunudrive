from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    
    # File management endpoints
    path('files/', views.FileListView.as_view(), name='file-list'),
    path('files/<str:file_id>/', views.FileDetailView.as_view(), name='file-detail'),
    path('files/<str:file_id>/download/', views.FileDownloadView.as_view(), name='file-download'),
    path('files/<str:file_id>/preview/', views.FilePreviewView.as_view(), name='file-preview'),
    
    # Trash management
    path('files/<str:file_id>/trash/', views.FileTrashView.as_view(), name='file-trash'),
    path('files/<str:file_id>/restore/', views.FileRestoreView.as_view(), name='file-restore'),
    path('trash/', views.TrashListView.as_view(), name='trash-list'),
    path('trash/empty/', views.EmptyTrashView.as_view(), name='empty-trash'),
    
    # Favorites
    path('files/<str:file_id>/favorite/', views.FileFavoriteView.as_view(), name='file-favorite'),
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    
    # Sharing
    path('files/<str:file_id>/share/', views.FileShareView.as_view(), name='file-share'),
    path('files/<str:file_id>/permissions/', views.FilePermissionsView.as_view(), name='file-permissions'),
    path('files/<str:file_id>/revoke/', views.files.FileRevokePermissionView.as_view(), name='file-revoke-permission'),
    path('shared/', views.SharedFilesView.as_view(), name='shared-files'),
    
    # Comments
    path('files/<str:file_id>/comments/', views.FileCommentsView.as_view(), name='file-comments'),
    path('files/<str:file_id>/comments/<str:comment_id>/', views.FileCommentDetailView.as_view(), name='file-comment-detail'),
    
    # Versions
    path('files/<str:file_id>/versions/', views.FileVersionsView.as_view(), name='file-versions'),
    path('files/<str:file_id>/versions/<str:version_id>/', views.FileVersionDetailView.as_view(), name='file-version-detail'),
    
    # Activity
    path('files/<str:file_id>/activity/', views.FileActivityView.as_view(), name='file-activity'),
    path('activity/', views.UserActivityView.as_view(), name='user-activity'),
    
    # Recent files
    path('recent/', views.RecentFilesView.as_view(), name='recent-files'),
    
    # Notifications
    path('notifications/', views.NotificationsView.as_view(), name='notifications'),
    path('notifications/mark-read/', views.MarkNotificationsReadView.as_view(), name='mark-notifications-read'),
    
    # Folders
    path('folders/', views.FolderListView.as_view(), name='folder-list'),
    path('folders/<str:folder_id>/', views.FolderDetailView.as_view(), name='folder-detail'),
    path('folders/<str:folder_id>/files/', views.FolderFilesView.as_view(), name='folder-files'),
    
    # Search
    path('search/', views.SearchView.as_view(), name='search'),
    
    # Tri
    path('files/sort/date/', views.files.FileSortByDateView.as_view(), name='files-sort-date'),
    path('files/sort/type/', views.files.FileSortByTypeView.as_view(), name='files-sort-type'),
    path('files/sort/size/', views.files.FileSortBySizeView.as_view(), name='files-sort-size'),
    # Tags
    path('tags/', views.TagsView.as_view(), name='tags'),
    
    # Statistics
    path('statistics/', views.StatisticsView.as_view(), name='statistics'),
]