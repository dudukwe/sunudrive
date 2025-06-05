import { useEffect, useState } from 'react';
import { Grid, Typography, Box, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { DeleteForever as DeleteForeverIcon, RestoreFromTrash as RestoreFromTrashIcon } from '@mui/icons-material';
import { useFileStore } from '../store/fileStore';
import FileCard from '../components/files/FileCard';

const TrashPage = () => {
  const { fetchTrashedFiles, trashedFiles, restoreFile, emptyTrash } = useFileStore();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchTrashedFiles();
  }, [fetchTrashedFiles]);
  
  const handleEmptyTrash = () => {
    setConfirmDialogOpen(true);
  };
  
  const confirmEmptyTrash = async () => {
    await emptyTrash();
    setConfirmDialogOpen(false);
  };
  
  const handleRestore = async (fileId: string) => {
    await restoreFile(fileId);
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trash
        </Typography>
        
        {trashedFiles.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={handleEmptyTrash}
          >
            Empty Trash
          </Button>
        )}
      </Box>
      
      {/* Content */}
      {trashedFiles.length > 0 ? (
        <Grid container spacing={3}>
          {trashedFiles.map((file) => (
            <Grid item key={file.id} xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RestoreFromTrashIcon />}
                    onClick={() => handleRestore(file.id)}
                  >
                    Restore
                  </Button>
                </Box>
                <FileCard file={file} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <DeleteForeverIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Trash is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Items in the trash will be automatically deleted after 30 days.
          </Typography>
        </Paper>
      )}
      
      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Empty Trash?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete all items in the trash? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmEmptyTrash} color="error" variant="contained">
            Empty Trash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrashPage;