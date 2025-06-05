import { useEffect } from 'react';
import { Grid, Typography, Box, Button, Paper } from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { useFileStore } from '../store/fileStore';
import FileCard from '../components/files/FileCard';

const SharedPage = () => {
  const { fetchSharedFiles, sharedFiles } = useFileStore();
  
  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]);
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shared with me
        </Typography>
      </Box>
      
      {/* Content */}
      {sharedFiles.length > 0 ? (
        <Grid container spacing={3}>
          {sharedFiles.map((file) => (
            <Grid item key={file.id} xs={12} sm={6} md={3}>
              <FileCard file={file} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <CloudDownloadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No files have been shared with you yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            When someone shares a file with you, it will appear here.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SharedPage;