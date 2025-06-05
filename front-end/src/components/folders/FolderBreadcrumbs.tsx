import { Breadcrumbs, Link, Typography, Box, IconButton } from '@mui/material';
import { NavigateNext, Home as HomeIcon } from '@mui/icons-material';
import { useFileStore } from '../../store/fileStore';

const FolderBreadcrumbs = () => {
  const { folderPath, navigateToFolder } = useFileStore();
  
  const handleClick = (folder: any, index: number) => {
    // If it's the last item in the path (current folder), do nothing
    if (index === folderPath.length - 1) return;
    
    // Navigate to the selected folder
    navigateToFolder(folder);
  };
  
  const handleHomeClick = () => {
    // Navigate to the root folder (null)
    navigateToFolder(null);
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <IconButton size="small" onClick={handleHomeClick} sx={{ mr: 1 }}>
        <HomeIcon fontSize="small" />
      </IconButton>
      
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        aria-label="folder navigation breadcrumbs"
      >
        {folderPath.length === 0 ? (
          <Typography color="text.primary">Home</Typography>
        ) : (
          <>
            <Link 
              underline="hover" 
              color="inherit" 
              onClick={handleHomeClick}
              sx={{ cursor: 'pointer' }}
            >
              Home
            </Link>
            
            {folderPath.map((folder, index) => {
              const isLast = index === folderPath.length - 1;
              
              return isLast ? (
                <Typography key={folder.id} color="text.primary">
                  {folder.name}
                </Typography>
              ) : (
                <Link
                  key={folder.id}
                  underline="hover"
                  color="inherit"
                  onClick={() => handleClick(folder, index)}
                  sx={{ cursor: 'pointer' }}
                >
                  {folder.name}
                </Link>
              );
            })}
          </>
        )}
      </Breadcrumbs>
    </Box>
  );
};

export default FolderBreadcrumbs;