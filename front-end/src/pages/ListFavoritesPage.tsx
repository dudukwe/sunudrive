import { useEffect } from 'react';
import { Grid, Typography, Box, Paper } from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { useFileStore } from '../store/fileStore';
import FileCard from '../components/files/FileCard';

const FavoritesPage = () => {
  const { fetchFavoriteFiles, favoriteFiles, isLoading } = useFileStore();

  useEffect(() => {
    fetchFavoriteFiles();
  }, [fetchFavoriteFiles]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Favorites
        </Typography>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>Loading favorites...</Typography>
        </Box>
      ) : favoriteFiles.length > 0 ? (
        <Grid container spacing={3}>
          {favoriteFiles.map((file) => (
            <Grid item key={file.id} xs={12} sm={6} md={3}>
              <FileCard file={file} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No favorite files yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Mark files as favorites to easily find them later. Click the star icon on any file to add it to your favorites.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FavoritesPage;