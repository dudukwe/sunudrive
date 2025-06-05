import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress
} from '@mui/material';
import { useFileStore } from '../../store/fileStore';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateFolderDialog = ({ open, onClose }: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const { createFolder, currentFolder } = useFileStore();
  
  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };
  
  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }
    
    setIsCreating(true);
    try {
      await createFolder(folderName, currentFolder?.id || null);
      handleClose();
    } catch (err) {
      setError('Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Folder Name"
          type="text"
          fullWidth
          value={folderName}
          onChange={(e) => {
            setFolderName(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error}
          disabled={isCreating}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={isCreating}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          color="primary" 
          disabled={isCreating || !folderName.trim()}
        >
          {isCreating ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;