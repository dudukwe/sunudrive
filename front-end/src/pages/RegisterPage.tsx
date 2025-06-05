import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PersonAdd as PersonAddIcon, Security, Speed, CloudUpload } from '@mui/icons-material';
import { getAuthStore } from '../store/authStore';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    cellphone: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { register, isLoading } = getAuthStore();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.cellphone) newErrors.cellphone = 'Phone number is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setServerError('');
    
    try {
      await register(formData);
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (error) {
      setServerError('Registration failed. Please try again with different credentials.');
    }
  };
  
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex',
      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
    }}>
      {/* Left Panel - Branding */}
      <Box sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
        color: 'white',
        p: 6,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.3"%3E%3Ccircle cx="7" cy="7" r="7"/%3E%3Ccircle cx="53" cy="7" r="7"/%3E%3Ccircle cx="30" cy="30" r="7"/%3E%3Ccircle cx="7" cy="53" r="7"/%3E%3Ccircle cx="53" cy="53" r="7"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }} />
        
        <Box sx={{ textAlign: 'center', zIndex: 1 }}>
          <Typography variant="h2" sx={{ 
            fontWeight: 'bold', 
            mb: 3,
            fontSize: { xs: '2.5rem', md: '3.5rem' }
          }}>
            DocStore
          </Typography>
          <Typography variant="h5" sx={{ 
            mb: 4, 
            opacity: 0.9,
            fontWeight: 300
          }}>
            Votre solution de gestion documentaire
          </Typography>
          
          {/* Features */}
          <Box sx={{ mt: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Security sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h6">Sécurisé et fiable</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Speed sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h6">Rapide et efficace</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <CloudUpload sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h6">Stockage cloud</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Registration Form */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'white',
        p: { xs: 3, md: 6 },
        minHeight: '100vh',
        overflow: 'auto'
      }}>
        <Container maxWidth="sm" sx={{ width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            py: 2
          }}>
            <Avatar sx={{ 
              m: 1, 
              bgcolor: '#1976d2',
              width: 56,
              height: 56
            }}>
              <PersonAddIcon sx={{ fontSize: 28 }} />
            </Avatar>
            
            <Typography component="h1" variant="h4" sx={{
              fontWeight: 'bold',
              color: '#1976d2',
              mb: 1
            }}>
              Créer un compte
            </Typography>
            
            <Typography variant="body1" sx={{
              color: 'text.secondary',
              mb: 3,
              textAlign: 'center'
            }}>
              Rejoignez DocStore et commencez à gérer vos documents
            </Typography>
            
            {serverError && (
              <Alert severity="error" sx={{ mt: 2, width: '100%', borderRadius: 2 }}>
                {serverError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    autoComplete="given-name"
                    name="first_name"
                    required
                    fullWidth
                    id="first_name"
                    label="Prénom"
                    autoFocus
                    value={formData.first_name}
                    onChange={handleChange}
                    error={!!errors.first_name}
                    helperText={errors.first_name}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="last_name"
                    label="Nom"
                    name="last_name"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                    error={!!errors.last_name}
                    helperText={errors.last_name}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Adresse email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="cellphone"
                    label="Numéro de téléphone"
                    name="cellphone"
                    autoComplete="tel"
                    value={formData.cellphone}
                    onChange={handleChange}
                    error={!!errors.cellphone}
                    helperText={errors.cellphone}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Mot de passe"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password2"
                    label="Confirmer le mot de passe"
                    type="password"
                    id="password2"
                    autoComplete="new-password"
                    value={formData.password2}
                    onChange={handleChange}
                    error={!!errors.password2}
                    helperText={errors.password2}
                    disabled={isLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
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
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Créer mon compte'}
              </Button>
              <Grid container justifyContent="center">
                <Grid item>
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    sx={{
                      color: '#1976d2',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                  >
                    Déjà un compte ? Se connecter
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          
          
        </Container>
      </Box>
    </Box>
  );
};

export default RegisterPage;