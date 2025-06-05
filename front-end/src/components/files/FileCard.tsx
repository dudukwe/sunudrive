import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardActions, Typography, IconButton, Menu, MenuItem, ListItemIcon, Tooltip, Box } from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  PictureAsPdf,
  Image,
  Movie,
  AudioFile,
  Description,
  Code,
  InsertDriveFile
} from '@mui/icons-material';
import { File } from '../../types';
import { fileService } from '../../services/fileService';
import { useFileStore } from '../../store/fileStore';
import ShareDialog from '../sharing/ShareDialog';
import { format } from 'date-fns';

interface FileCardProps {
  file: File;
}

const FileCard = ({ file }: FileCardProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleFavorite, trashFile } = useFileStore();
  
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
  
  const handleFavoriteToggle = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    await toggleFavorite(file.id);
  };
  
  const handleFileOpen = async () => {
    // Le clic principal ouvre maintenant le preview
    try {
      await fileService.previewFile(file.id);
    } catch (error) {
      console.error('Preview failed:', error);
      // You might want to show an error toast here
    }
  };
  
  const handlePreview = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    try {
      await fileService.previewFile(file.id);
    } catch (error) {
      console.error('Preview failed:', error);
      // You might want to show an error toast here
    }
    handleMenuClose();
  };

  const handleViewDetails = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    navigate(`/files/${file.id}`);
    handleMenuClose();
  };
  
  const handleDownload = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    try {
      await fileService.downloadFile(file.id, file.title);
    } catch (error) {
      console.error('Download failed:', error);
      // You might want to show an error toast here
    }
    handleMenuClose();
  };
  
  const handleDelete = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    await trashFile(file.id);
    handleMenuClose();
  };
  
  const handleShare = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setShareDialogOpen(true);
    handleMenuClose();
  };
  
  const getFileIcon = () => {
    switch (file.type.toLowerCase()) {
      case 'pdf':
        return <PictureAsPdf fontSize="large" color="error" />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image fontSize="large" color="primary" />;
      case 'video':
      case 'mp4':
      case 'mov':
      case 'avi':
        return <Movie fontSize="large" color="secondary" />;
      case 'audio':
      case 'mp3':
      case 'wav':
        return <AudioFile fontSize="large" color="info" />;
      case 'doc':
      case 'docx':
      case 'txt':
        return <Description fontSize="large" color="primary" />;
      case 'code':
      case 'js':
      case 'html':
      case 'css':
      case 'py':
        return <Code fontSize="large" color="warning" />;
      default:
        return <InsertDriveFile fontSize="large" color="action" />;
    }
  };
  
  return (
    <>
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
        onClick={handleFileOpen}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 120, 
            bgcolor: 'grey.100',
            overflow: 'hidden',
          }}
        >
          {getFileIcon()}
        </Box>
        
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Typography variant="h6" component="div" noWrap title={file.title}>
            {file.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {file.author}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {format(new Date(file.uploaded_at), 'MMM d, yyyy')} · {formatFileSize(file.size)}
          </Typography>
          
          {file.tags.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {file.tags.slice(0, 2).map((tag) => (
                <Typography
                  key={tag}
                  variant="caption"
                  sx={{
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.6rem',
                  }}
                >
                  {tag}
                </Typography>
              ))}
              {file.tags.length > 2 && (
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'grey.100',
                    color: 'text.secondary',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.6rem',
                  }}
                >
                  +{file.tags.length - 2}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
        
        <CardActions disableSpacing sx={{ px: 2, py: 1 }}>
          <Tooltip title={file.is_favorite ? "Remove from favorites" : "Add to favorites"}>
            <IconButton
              aria-label="add to favorites"
              onClick={handleFavoriteToggle}
              size="small"
            >
              {file.is_favorite ? (
                <StarIcon fontSize="small" color="warning" />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Preview">
            <IconButton aria-label="preview" onClick={handlePreview} size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download">
            <IconButton aria-label="download" onClick={handleDownload} size="small">
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton
            aria-label="more options"
            onClick={handleMenuOpen}
            size="small"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            id={`file-menu-${file.id}`}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handlePreview}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              Preview
            </MenuItem>
            <MenuItem onClick={handleViewDetails}>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              View Details
            </MenuItem>
            <MenuItem onClick={handleDownload}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              Download
            </MenuItem>
            <MenuItem onClick={handleShare}>
              <ListItemIcon>
                <ShareIcon fontSize="small" />
              </ListItemIcon>
              Share
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Edit details
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              Move to trash
            </MenuItem>
          </Menu>
        </CardActions>
      </Card>
      
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        fileId={file.id}
        fileName={file.title}
      />
    </>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileCard;