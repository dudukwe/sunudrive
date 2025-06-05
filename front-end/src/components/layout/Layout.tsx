import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, 
  CssBaseline, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Badge, 
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Button,
  Paper
} from '@mui/material';
import { 
  ChevronLeft, 
  Menu as MenuIcon, 
  Logout, 
  Person, 
  Settings, 
  Notifications,
  Share,
  Visibility,
  Edit,
  AdminPanelSettings,
  Close,
  MarkEmailRead
} from '@mui/icons-material';
import { Search as SearchIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import SearchBar from '../common/SearchBar';
import { getAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

interface NotificationData {
  _id: string;
  user_id: string;
  type: string;
  message: string;
  file: string;
  created_at: Date;
  is_read: boolean;
  details: { access_level: string };
}

export default function Layout() {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const { user, logout } = getAuthStore();
  const navigate = useNavigate();
  
  // État des notifications
  const [notifications, setNotifications] = useState<NotificationData[]>([
    {
      _id: '1',
      user_id: '3',
      type: 'share',
      message: "Falou Jaaw a partagé 'Dossier1' avec vous",
      file: 'Dossier1',
      created_at: new Date('2025-05-25T12:09:16.638Z'),
      is_read: false,
      details: { access_level: 'view' }
    },
    {
      _id: '2',
      user_id: '1',
      type: 'share',
      message: "Marie Diop a partagé 'fichier pdf du sous-dos123' avec vous",
      file: 'fichier pdf du sous-dos123',
      created_at: new Date('2025-05-25T17:08:49.708Z'),
      is_read: false,
      details: { access_level: 'admin' }
    },
    {
      _id: '3',
      user_id: '4',
      type: 'share',
      message: "Ahmed Ndiaye a partagé 'Conseils' avec vous",
      file: 'Conseils',
      created_at: new Date('2025-05-28T18:25:13.347Z'),
      is_read: false,
      details: { access_level: 'edit' }
    },
    {
      _id: '4',
      user_id: '7',
      type: 'share',
      message: "Amina Sarr a partagé 'ia_intro' avec vous",
      file: 'ia_intro',
      created_at: new Date('2025-05-29T13:59:35.781Z'),
      is_read: true,
      details: { access_level: 'edit' }
    },
    {
      _id: '5',
      user_id: '1',
      type: 'share',
      message: "Ousmane Fall a partagé 'DHTtester' avec vous",
      file: 'DHTtester',
      created_at: new Date('2025-05-29T14:14:08.103Z'),
      is_read: false,
      details: { access_level: 'view' }
    }
  ]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };
  
  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === id ? { ...notif, is_read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, is_read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif._id !== id));
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'view':
        return <Visibility sx={{ fontSize: 16, color: 'primary.main' }} />;
      case 'edit':
        return <Edit sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'admin':
        return <AdminPanelSettings sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <Share sx={{ fontSize: 16, color: 'text.secondary' }} />;
    }
  };

  const getAccessLevelChip = (level: string) => {
    const configs = {
      view: { label: 'Lecture', color: 'primary' as const },
      edit: { label: 'Édition', color: 'success' as const },
      admin: { label: 'Admin', color: 'error' as const }
    };
    const config = configs[level as keyof typeof configs] || { label: level, color: 'default' as const };
    return <Chip label={config.label} size="small" color={config.color} variant="outlined" />;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(25, 118, 210, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 2,
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.05)',
              },
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                SD
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SunuDrive
            </Typography>
          </Box>
          
          <Box sx={{ 
            flexGrow: 1, 
            maxWidth: '500px',
            mx: { xs: 1, sm: 3 }
          }}>
            <SearchBar />
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit"
                onClick={handleNotificationClick}
                sx={{
                  borderRadius: '12px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Account">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                sx={{
                  ml: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: 'secondary.main',
                    width: 36,
                    height: 36,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Menu utilisateur */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              elevation: 8,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                borderRadius: '12px',
                minWidth: 180,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <MenuItem 
              onClick={handleProfile}
              sx={{
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem 
              onClick={handleClose}
              sx={{
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                }
              }}
            >
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem 
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                mx: 1,
                my: 0.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  color: 'error.main',
                }
              }}
            >
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          {/* Popover des notifications */}
          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              elevation: 8,
              sx: {
                mt: 1.5,
                borderRadius: '12px',
                width: '400px',
                maxHeight: '80vh',
                overflow: 'hidden',
                filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.15))',
              }
            }}
          >
            {/* Header des notifications */}
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes lues'}
                </Typography>
              </Box>
              <IconButton 
                onClick={handleNotificationClose}
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Actions */}
            {unreadCount > 0 && (
              <Box sx={{ p: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Button 
                  size="small" 
                  onClick={markAllAsRead}
                  startIcon={<MarkEmailRead />}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                >
                  Marquer toutes comme lues
                </Button>
              </Box>
            )}

            {/* Liste des notifications */}
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Notifications sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                  <Typography>Aucune notification</Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.map((notification, index) => (
                    <ListItem
                      key={notification._id}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: !notification.is_read ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                        borderLeft: !notification.is_read ? '4px solid #1976d2' : '4px solid transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        },
                        ...(index < notifications.length - 1 && {
                          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
                        })
                      }}
                      onClick={() => markAsRead(notification._id)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                          width: 40,
                          height: 40
                        }}>
                          <Share />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {notification.message}
                            </Typography>
                            {!notification.is_read && (
                              <Box sx={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main' 
                              }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getAccessLevelIcon(notification.details.access_level)}
                              {getAccessLevelChip(notification.details.access_level)}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(notification.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        sx={{ 
                          opacity: 0.5,
                          '&:hover': { 
                            opacity: 1,
                            color: 'error.main' 
                          }
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Footer */}
            {notifications.length > 0 && (
              <Box sx={{ 
                p: 1, 
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                backgroundColor: 'rgba(0, 0, 0, 0.02)'
              }}>
                <Button 
                  fullWidth 
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: '8px',
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  Voir toutes les notifications
                </Button>
              </Box>
            )}
          </Popover>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#fafafa',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            ...(open ? {} : {
              overflowX: 'hidden',
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              width: (theme) => theme.spacing(7),
              [theme.breakpoints.up('sm')]: {
                width: (theme) => theme.spacing(9),
              },
            }),
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
            backgroundColor: '#ffffff',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <IconButton 
            onClick={handleDrawerClose}
            sx={{
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Toolbar>
        <Divider />
        <Sidebar open={open} />
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}