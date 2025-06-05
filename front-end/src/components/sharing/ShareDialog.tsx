import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Box,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Person, Edit, Delete } from '@mui/icons-material';
import { fileService } from '../../services/fileService';
import { FilePermission } from '../../types';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

const ShareDialog = ({ open, onClose, fileId, fileName }: ShareDialogProps) => {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit' | 'admin'>('view');
  const [permissions, setPermissions] = useState<FilePermission[]>([]);
  const [owner, setOwner] = useState<{ user_id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (open) {
      fetchPermissions();
      // Reset states when dialog opens
      setEmail('');
      setError('');
      setSuccess('');
      setAccessLevel('view');
    }
  }, [open, fileId]);
  
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fileService.getFilePermissions(fileId);
      setPermissions(response.permissions);
      setOwner(response.owner);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setError('Failed to load sharing information');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShare = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    setSharing(true);
    setError('');
    setSuccess('');
    
    try {
      await fileService.shareFile(fileId, email.trim(), accessLevel);
      setEmail('');
      setSuccess(`File shared successfully with ${email.trim()}`);
      fetchPermissions(); // Refresh the permissions list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to share file:', error);
      setError('Failed to share file. Please check if the email address is valid and the user exists.');
    } finally {
      setSharing(false);
    }
  };
  
  const handleRemovePermission = async (userId: string) => {
    try {
      await fileService.removeFilePermission(fileId, userId);
      fetchPermissions(); // Refresh the permissions list
    } catch (error) {
      console.error('Failed to remove permission:', error);
      setError('Failed to remove access');
    }
  };
  
  const handleUpdatePermission = async (userId: string, newAccessLevel: 'view' | 'edit' | 'admin') => {
    try {
      await fileService.updateFilePermission(fileId, userId, newAccessLevel);
      fetchPermissions(); // Refresh the permissions list
    } catch (error) {
      console.error('Failed to update permission:', error);
      setError('Failed to update access level');
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleShare();
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share "{fileName}"</DialogTitle>
      <DialogContent>
        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="subtitle1" gutterBottom>
          Add people
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            label="Email address"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sharing}
            size="small"
            placeholder="Enter email address"
            helperText="Enter the email address of the person you want to share with"
          />
          
          <FormControl variant="outlined" sx={{ minWidth: 120 }} size="small">
            <InputLabel id="access-level-label">Access</InputLabel>
            <Select
              labelId="access-level-label"
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as 'view' | 'edit' | 'admin')}
              label="Access"
              disabled={sharing}
            >
              <MenuItem value="view">View</MenuItem>
              <MenuItem value="edit">Edit</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleShare}
            disabled={!email.trim() || sharing}
            sx={{ minWidth: 80 }}
          >
            {sharing ? <CircularProgress size={20} color="inherit" /> : 'Share'}
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          People with access
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {/* Owner */}
            {owner && (
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={owner.name}
                  secondary="Owner"
                />
              </ListItem>
            )}
            
            {/* Shared permissions */}
            {permissions.map((permission) => (
              <ListItem key={permission.user_id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={permission.name || permission.user_id}
                  secondary={`${permission.access_level.charAt(0).toUpperCase() + permission.access_level.slice(1)} access`}
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 80, mr: 1 }}>
                    <Select
                      value={permission.access_level}
                      onChange={(e) => handleUpdatePermission(permission.user_id, e.target.value as 'view' | 'edit' | 'admin')}
                      variant="outlined"
                    >
                      <MenuItem value="view">View</MenuItem>
                      <MenuItem value="edit">Edit</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => handleRemovePermission(permission.user_id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            
            {/* Empty state */}
            {permissions.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No one else has access"
                  secondary="Share this file to give others access"
                  sx={{ textAlign: 'center', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;