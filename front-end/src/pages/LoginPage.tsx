import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { 
  LockOutlined as LockOutlinedIcon,
  CloudUpload as CloudUploadIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { getAuthStore } from '../store/authStore';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = getAuthStore();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      setError('Please enter your email/phone and password');
      return;
    }
    
    setError('');
    
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const features = [
    {
      icon: <CloudUploadIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Upload Facile',
      description: 'Glissez-déposez vos fichiers en toute simplicité'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Sécurisé',
      description: 'Vos documents sont protégés avec un chiffrement avancé'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'white' }} />,
      title: 'Rapide',
      description: 'Accédez à vos fichiers instantanément, où que vous soyez'
    }
  ];
  
  return (
    <Box sx={{ 
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      display: 'flex',
      overflow: 'hidden'
    }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Partie gauche - Présentation */}
        <Grid item xs={12} md={6} sx={{ 
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          p: 4
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <FolderOpenIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: 'white'
            }}>
              DocStore
            </Typography>
            <Typography variant="h6" sx={{ 
              opacity: 0.9,
              mb: 4,
              color: 'white'
            }}>
              Votre plateforme de gestion de fichiers nouvelle génération
            </Typography>
          </Box>

          <Box sx={{ width: '100%', maxWidth: 400 }}>
            {features.map((feature, index) => (
              <Card key={index} sx={{ 
                mb: 2,
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white'
              }}>
                <CardContent sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  py: 2
                }}>
                  <Box sx={{ mr: 2 }}>
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: 'white' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Partie droite - Formulaire de connexion */}
        <Grid item xs={12} md={6} sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'white',
          p: 4
        }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              width: '100%',
              maxWidth: 400,
              bgcolor: 'white'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 3
            }}>
              <Avatar sx={{ 
                m: 1, 
                bgcolor: '#1976d2',
                width: 56,
                height: 56
              }}>
                <LockOutlinedIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography component="h1" variant="h4" sx={{ 
                fontWeight: 'bold',
                color: '#1976d2',
                mb: 1
              }}>
                Connexion
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'text.secondary',
                textAlign: 'center'
              }}>
                Accédez à votre espace de gestion
              </Typography>
            </Box>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="identifier"
                label="Email ou Téléphone"
                name="identifier"
                autoComplete="email"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1976d2',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 3, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0',
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Se connecter'}
              </Button>
              
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  variant="body2"
                  sx={{
                    color: '#1976d2',
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Pas encore de compte ? Inscrivez-vous
                </Link>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
     
    </Box>
  );
};

export default LoginPage;