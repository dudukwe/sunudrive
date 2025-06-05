from .auth import RegisterView, LoginView, UserProfileView
from .files import (
    FileListView, FileDetailView, FileDownloadView, FilePreviewView,
    FileTrashView, FileRestoreView, TrashListView, EmptyTrashView,
    FileFavoriteView, FavoriteListView, FileShareView, FilePermissionsView,
    SharedFilesView, FileCommentsView, FileCommentDetailView, FileVersionsView,
    FileVersionDetailView, FileActivityView, UserActivityView, RecentFilesView
)
from .folders import FolderListView, FolderDetailView, FolderFilesView
from .notifications import NotificationsView, MarkNotificationsReadView
from .search import SearchView
from .statistics import StatisticsView
from .tags import TagsView