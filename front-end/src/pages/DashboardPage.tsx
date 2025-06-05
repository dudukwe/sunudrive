import { useEffect, useState } from 'react';
import { Grid, Typography, Paper, Box, Card, CardContent, Button, Divider } from '@mui/material';
import { 
  BarChart as BarChartIcon,
  Article as ArticleIcon,
  Timeline as TimelineIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFileStore } from '../store/fileStore';
import { activityService } from '../services/activityService';
import { Statistics, File, FileActivity } from '../types';
import FileCard from '../components/files/FileCard';
import FileUploader from '../components/common/FileUploader';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const { fetchRecentFiles, recentFiles } = useFileStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const statistics = await activityService.getStatistics();
        setStats(statistics);
        await fetchRecentFiles();
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    };
    
    loadData();
  }, [fetchRecentFiles]);
  
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setShowUploader(!showUploader)}
        >
          {showUploader ? 'Hide Uploader' : 'Upload File'}
        </Button>
      </Box>
      
      {showUploader && (
        <FileUploader onUploadComplete={() => {
          setShowUploader(false);
          fetchRecentFiles();
        }} />
      )}
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Total Files
              </Typography>
              <ArticleIcon color="primary" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {stats?.total_files || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats ? `${Object.entries(stats.files_by_type).map(([type, count]) => `${count} ${type}`).join(', ')}` : 'Loading...'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Storage Used
              </Typography>
              <BarChartIcon color="secondary" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {stats ? formatSize(stats.total_size) : '0 KB'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats ? `Across ${Object.keys(stats.storage_by_type).length} file types` : 'Loading...'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                Recent Activity
              </Typography>
              <TimelineIcon color="info" />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              {stats?.recent_activity.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {stats?.recent_activity.length ? 'Events in the last 24 hours' : 'No recent activity'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column', 
              height: 140,
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Access
              </Typography>
              <CloudUploadIcon />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size="small" 
                onClick={() => navigate('/files')}
                sx={{ mb: 1, color: 'white' }}
              >
                Browse Files
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setShowUploader(true)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Upload New
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recent Files */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Files
      </Typography>
      <Grid container spacing={3}>
        {recentFiles.length > 0 ? (
          recentFiles.slice(0, 4).map((file) => (
            <Grid item key={file.id} xs={12} sm={6} md={3}>
              <FileCard file={file} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                No recent files. Start by uploading your first document.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => setShowUploader(true)}
                sx={{ mt: 2 }}
              >
                Upload File
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Recent Activity */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Activity
      </Typography>
      <Paper elevation={1} sx={{ p: 0, overflow: 'hidden' }}>
        {stats?.recent_activity && stats.recent_activity.length > 0 ? (
          stats.recent_activity.slice(0, 5).map((activity, index) => (
            <Box key={activity.id}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 2 }}>
                  {getActivityIcon(activity)}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    {formatActivity(activity)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Box>
              </Box>
              {index < stats.recent_activity.slice(0, 5).length - 1 && <Divider />}
            </Box>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No recent activity to display.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

const getActivityIcon = (activity: FileActivity) => {
  switch (activity.action) {
    case 'upload':
      return <CloudUploadIcon color="primary" />;
    case 'view':
      return <ArticleIcon color="action" />;
    case 'download':
      return <CloudUploadIcon color="action" sx={{ transform: 'rotate(180deg)' }} />;
    case 'share':
      return <ArticleIcon color="info" />;
    case 'comment':
      return <ArticleIcon color="secondary" />;
    case 'favorite':
      return <ArticleIcon color="warning" />;
    default:
      return <ArticleIcon />;
  }
};

const formatActivity = (activity: FileActivity): string => {
  const fileName = activity.file_title || 'a file';
  const userName = activity.user_name || 'Someone';
  
  switch (activity.action) {
    case 'upload':
      return `${userName} uploaded "${fileName}"`;
    case 'view':
      return `${userName} viewed "${fileName}"`;
    case 'download':
      return `${userName} downloaded "${fileName}"`;
    case 'share':
      if (activity.details?.shared_with) {
        return `${userName} shared "${fileName}" with another user`;
      }
      return `${userName} shared "${fileName}"`;
    case 'comment':
      return `${userName} commented on "${fileName}"`;
    case 'favorite':
      return `${userName} added "${fileName}" to favorites`;
    case 'unfavorite':
      return `${userName} removed "${fileName}" from favorites`;
    default:
      return `${userName} performed action "${activity.action}" on "${fileName}"`;
  }
};

export default DashboardPage;