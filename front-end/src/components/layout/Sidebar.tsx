import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Typography, 
  Box,
  Avatar,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Share as ShareIcon,
  Storage as StorageIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getAuthStore } from '../../store/authStore';
import { activityService } from '../../services/activityService';

interface SidebarProps {
  open: boolean;
}

const Sidebar = ({ open }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = getAuthStore();
  const [stats, setStats] = useState<{ total_files: number; total_size: number } | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await activityService.getStatistics();
        setStats({
          total_files: data.total_files,
          total_size: data.total_size
        });
      } catch (error) {
        console.error('Failed to fetch statistics', error);
      }
    };
    
    fetchStats();
  }, []);
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Files', icon: <FolderIcon />, path: '/files' },
    { text: 'Shared with me', icon: <ShareIcon />, path: '/shared' },
    { text: 'Favorites', icon: <StarIcon />, path: '/favorites' },
    { text: 'Trash', icon: <DeleteIcon />, path: '/trash' },
  ];

  // Calculer le pourcentage d'utilisation du stockage (exemple: limite de 10GB)
  const storageLimit = 10 * 1024 * 1024 * 1024; // 10GB en bytes
  const storagePercentage = stats ? Math.min((stats.total_size / storageLimit) * 100, 100) : 0;
  
  return (
    <>
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  mx: 1,
                  borderRadius: 2,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    transform: 'translateX(2px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    backgroundColor: 'primary.contrastText',
                    borderRadius: '0 2px 2px 0',
                  } : {},
                }}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? 'primary.contrastText' : 'primary.main',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    transition: 'opacity 0.2s ease-in-out',
                  }}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider sx={{ mx: 2, my: 2 }} />
      
      {open && stats && (
        <Box sx={{ p: 2, mt: 'auto' }}>
          {/* Section Stockage */}
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Storage
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {stats.total_files} files • {formatSize(stats.total_size)} used
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={storagePercentage}
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: storagePercentage > 80 ? 'warning.main' : 'primary.main',
                }
              }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {formatSize(storageLimit - (stats?.total_size || 0))} remaining
            </Typography>
          </Box>

          {/* Section Utilisateur */}
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -10,
              right: -10,
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  mr: 1.5,
                  backgroundColor: 'primary.contrastText',
                  color: 'primary.main',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            
            <Chip
              label="Active"
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'primary.contrastText',
                fontSize: '0.75rem',
                height: 20,
              }}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

// Helper function to format file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default Sidebar;