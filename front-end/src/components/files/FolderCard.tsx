import { useState } from 'react';
import { Card, CardContent, CardActions, Typography, IconButton, Menu, MenuItem, ListItemIcon, Box } from '@mui/material';
import { 
  Folder as FolderIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Folder } from '../../types';
import { useFileStore } from '../../store/fileStore';
import { format } from 'date-fns';

interface FolderCardProps {
  folder: Folder;
}

const FolderCard = ({ folder }: FolderCardProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { navigateToFolder, deleteFolder } = useFileStore();
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };
  
  const handleFolderOpen = () => {
    navigateToFolder(folder);
  };
  
  const handleDelete = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    await deleteFolder(folder.id);
    handleMenuClose();
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
        cursor: 'pointer',
      }}
      onClick={handleFolderOpen}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 120, 
          bgcolor: 'primary.50',
          overflow: 'hidden',
        }}
      >
        <FolderIcon sx={{ fontSize: 72, color: 'primary.main' }} />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="h6" component="div" noWrap title={folder.name}>
          {folder.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Created {format(new Date(folder.created_at), 'MMM d, yyyy')}
        </Typography>
      </CardContent>
      
      <CardActions disableSpacing sx={{ px: 2, py: 1 }}>
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton
          aria-label="more options"
          onClick={handleMenuOpen}
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        
        <Menu
          id={`folder-menu-${folder.id}`}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            Share
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Rename
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
};

export default FolderCard;