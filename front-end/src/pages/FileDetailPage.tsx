import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  TextField,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useFileStore } from '../store/fileStore';
import { fileService } from '../services/fileService';
import { File, FileComment, FileActivity, FileVersion } from '../types';
import ShareDialog from '../components/sharing/ShareDialog';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const FileDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchFileDetails, currentFile, toggleFavorite, trashFile } = useFileStore();
  const [tabValue, setTabValue] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [comments, setComments] = useState<FileComment[]>([]);
  const [activity, setActivity] = useState<FileActivity[]>([]);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchFileDetails(id);
      loadFileData(id);
    }
  }, [id]);
  
  const loadFileData = async (fileId: string) => {
    try {
      const [commentsData, activityData, versionsData] = await Promise.all([
        fileService.getComments(fileId),
        fileService.getActivity(fileId),
        fileService.getVersions(fileId),
      ]);
      
      setComments(commentsData);
      setActivity(activityData);
      setVersions(versionsData);
    } catch (error) {
      console.error('Failed to load file data', error);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleFavoriteToggle = async () => {
    if (currentFile) {
      await toggleFavorite(currentFile.id);
    }
  };
  
  const handleDownload = () => {
    if (currentFile) {
      window.open(fileService.getDownloadUrl(currentFile.id), '_blank');
    }
  };
  
  const handlePreview = () => {
    if (currentFile) {
      window.open(fileService.getPreviewUrl(currentFile.id), '_blank');
    }
  };
  
  const handleShare = () => {
    setShareDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (currentFile) {
      await trashFile(currentFile.id);
      navigate('/files');
    }
  };
  
  const handleAddComment = async () => {
    if (!commentText.trim() || !currentFile) return;
    
    setLoadingComments(true);
    try {
      const newComment = await fileService.addComment(currentFile.id, commentText);
      setComments([...comments, newComment]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setLoadingComments(false);
    }
  };
  
  if (!currentFile) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="h6">Loading file details...</Typography>
      </Box>
    );
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/files')}
          sx={{ mb: 2 }}
        >
          Back to Files
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {currentFile.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {currentFile.author} • {format(new Date(currentFile.uploaded_at), 'MMMM d, yyyy')} • {formatFileSize(currentFile.size)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleFavoriteToggle} color={currentFile.is_favorite ? 'warning' : 'default'}>
              {currentFile.is_favorite ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            
            <IconButton onClick={handleShare} color="primary">
              <ShareIcon />
            </IconButton>
            
            <IconButton onClick={handleDownload} color="primary">
              <DownloadIcon />
            </IconButton>
            
            <IconButton onClick={handlePreview} color="primary">
              <VisibilityIcon />
            </IconButton>
            
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {currentFile.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>
      </Box>
      
      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="file details tabs"
          variant="fullWidth"
        >
          <Tab label="Details" icon={<PersonIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="Comments" icon={<CommentIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Activity" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(2)} />
          <Tab label="Versions" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(3)} />
        </Tabs>
      </Paper>
      
      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                File Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Filename
                  </Typography>
                  <Typography variant="body1">
                    {currentFile.original_filename || currentFile.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'uppercase' }}>
                    {currentFile.type}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body1">
                    {formatFileSize(currentFile.size)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Uploaded
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(currentFile.uploaded_at), 'MMMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Modified
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(currentFile.updated_at), 'MMMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Author
                  </Typography>
                  <Typography variant="body1">
                    {currentFile.author}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {currentFile.description || 'No description provided'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Preview"
                      secondary="View the file content"
                    />
                    <IconButton edge="end" onClick={handlePreview}>
                      <VisibilityIcon />
                    </IconButton>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Download"
                      secondary="Save file to your device"
                    />
                    <IconButton edge="end" onClick={handleDownload}>
                      <DownloadIcon />
                    </IconButton>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Share"
                      secondary="Share with other users"
                    />
                    <IconButton edge="end" onClick={handleShare}>
                      <ShareIcon />
                    </IconButton>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary={currentFile.is_favorite ? "Remove from favorites" : "Add to favorites"}
                      secondary="Mark as important"
                    />
                    <IconButton edge="end" onClick={handleFavoriteToggle} color={currentFile.is_favorite ? 'warning' : 'default'}>
                      {currentFile.is_favorite ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Move to Trash"
                      secondary="Delete this file"
                    />
                    <IconButton edge="end" onClick={handleDelete} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Comments
          </Typography>
          
          <Box sx={{ mb: 3, display: 'flex' }}>
            <TextField
              fullWidth
              placeholder="Add a comment..."
              variant="outlined"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={loadingComments}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleAddComment}
              disabled={!commentText.trim() || loadingComments}
            >
              Post
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {comments.length > 0 ? (
            <List>
              {comments.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start" sx={{ py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {comment.user_name || `User ${comment.user_id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    }
                    secondary={comment.text}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CommentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No comments yet. Be the first to comment!
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Activity Log
          </Typography>
          
          {activity.length > 0 ? (
            <List>
              {activity.map((event) => (
                <ListItem key={event.id} sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">
                          {formatActivity(event)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No activity recorded for this file.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Version History
          </Typography>
          
          {versions.length > 0 ? (
            <List>
              {versions.map((version) => (
                <ListItem
                  key={version.id}
                  sx={{
                    py: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          Version {version.version_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(version.size)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">
                          Created by User {version.created_by}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <HistoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No version history available.
              </Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>
      
      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        fileId={currentFile.id}
        fileName={currentFile.title}
      />
    </Box>
  );
};

const formatActivity = (activity: FileActivity): string => {
  const userName = activity.user_name || activity.username  || `User ${activity.user_id}`;
  
  switch (activity.action) {
    case 'upload':
      return `${userName} uploaded this file`;
    case 'view':
      return `${userName} viewed this file`;
    case 'download':
      return `${userName} downloaded this file`;
    case 'share':
      if (activity.details?.shared_with) {
        const sharedWith = activity.details.shared_with;
        const accessLevel = activity.details.access_level;
        return `${userName} shared this file with User ${sharedWith} (${accessLevel} access)`;
      }
      return `${userName} shared this file`;
    case 'comment':
      return `${userName} commented on this file`;
    case 'favorite':
      return `${userName} added this file to favorites`;
    case 'unfavorite':
      return `${userName} removed this file from favorites`;
    default:
      return `${userName} performed action "${activity.action}"`;
  }
};

export default FileDetailPage;