import { useEffect, useState } from 'react';
import { 
  Grid, Typography, Box, Button, Divider, Breadcrumbs, 
  Link, Menu, MenuItem, IconButton, Chip 
} from '@mui/material';
import { 
  CreateNewFolder as CreateNewFolderIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CloudUpload as CloudUploadIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useFileStore } from '../store/fileStore';
import FileCard from '../components/files/FileCard';
import FolderCard from '../components/files/FolderCard';
import FileUploader from '../components/common/FileUploader';
import CreateFolderDialog from '../components/folders/CreateFolderDialog';

type SortField = 'title' | 'uploaded_at' | 'size';
type SortOrder = 'asc' | 'desc';

const FilesPage = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [sortField, setSortField] = useState<SortField>('uploaded_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { 
    files, 
    folders, 
    currentFolder,
    folderPath,
    fetchFiles, 
    fetchFolders,
    navigateToFolder,
    navigateUp
  } = useFileStore();
  
  useEffect(() => {
    fetchFiles(currentFolder?.id);
    fetchFolders(currentFolder?.id);
  }, [currentFolder]);
  
  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    handleSortClose();
  };
  
  const handleRefresh = () => {
    fetchFiles(currentFolder?.id);
    fetchFolders(currentFolder?.id);
  };

  // Navigation vers un dossier
  const handleFolderClick = (folder: Folder) => {
    navigateToFolder(folder);
  };

  // Navigation vers le dossier parent ou racine
  const handleBreadcrumbClick = (folder: Folder | null) => {
    navigateToFolder(folder);
  };
  
  const sortedFiles = [...files].sort((a, b) => {
    if (sortField === 'title') {
      return sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortField === 'uploaded_at') {
      return sortOrder === 'asc'
        ? new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
        : new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    } else if (sortField === 'size') {
      return sortOrder === 'asc'
        ? a.size - b.size
        : b.size - a.size;
    }
    return 0;
  });
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Files
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CreateNewFolderIcon />}
            onClick={() => setCreateFolderOpen(true)}
          >
            New Folder
          </Button>
          
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => setShowUploader(!showUploader)}
          >
            Upload
          </Button>
        </Box>
      </Box>
      
      {/* Breadcrumbs - Navigation avec séparateurs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="folder navigation"
        >
          {/* Racine */}
          <Link
            component="button"
            variant="body1"
            onClick={() => handleBreadcrumbClick(null)}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          
          {/* Chemin des dossiers */}
          {folderPath.map((folder, index) => (
            <Link
              key={folder.id}
              component="button"
              variant="body1"
              onClick={() => handleBreadcrumbClick(folder)}
              sx={{ 
                textDecoration: 'none',
                color: index === folderPath.length - 1 ? 'text.primary' : 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {folder.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>
      
      {/* Uploader */}
      {showUploader && (
        <FileUploader onUploadComplete={() => {
          setShowUploader(false);
          handleRefresh();
        }} />
      )}
      
      {/* Toolbar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2, 
          mt: 3,
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle1" component="div">
          {folders.length} folders, {files.length} files
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            size="small"
            startIcon={<SortIcon />}
            onClick={handleSortClick}
            sx={{ mr: 1 }}
          >
            Sort by: {sortField}{' '}
            {sortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
          </Button>
          
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
          >
            <MenuItem onClick={() => handleSort('title')}>
              Name {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </MenuItem>
            <MenuItem onClick={() => handleSort('uploaded_at')}>
              Date {sortField === 'uploaded_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </MenuItem>
            <MenuItem onClick={() => handleSort('size')}>
              Size {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
            </MenuItem>
          </Menu>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <IconButton
            color={viewMode === 'grid' ? 'primary' : 'default'}
            onClick={() => setViewMode('grid')}
          >
            <ViewModuleIcon />
          </IconButton>
          
          <IconButton
            color={viewMode === 'list' ? 'primary' : 'default'}
            onClick={() => setViewMode('list')}
          >
            <ViewListIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Content - Folders */}
      {folders.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Folders
          </Typography>
          <Grid container spacing={3}>
            {folders.map((folder) => (
              <Grid item key={folder.id} xs={12} sm={6} md={3}>
                <FolderCard 
                  folder={folder} 
                  onClick={() => handleFolderClick(folder)}
                />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      )}
      
      {/* Content - Files */}
      <Typography variant="h6" gutterBottom>
        Files
      </Typography>
      
      {sortedFiles.length > 0 ? (
        <Grid container spacing={3}>
          {sortedFiles.map((file) => (
            <Grid item key={file.id} xs={12} sm={6} md={viewMode === 'grid' ? 3 : 6}>
              <FileCard file={file} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {currentFolder ? `No files in "${currentFolder.name}"` : 'No files in this location'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => setShowUploader(true)}
            sx={{ mt: 1 }}
          >
            Upload Files
          </Button>
        </Box>
      )}
      
      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
      />
    </Box>
  );
};

export default FilesPage;