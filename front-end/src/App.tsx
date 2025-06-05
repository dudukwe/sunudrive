import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAuthStore, initializeAuth } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import FileDetailPage from './pages/FileDetailPage';
import SharedPage from './pages/SharedPage';
import TrashPage from './pages/TrashPage';
import ProfilePage from './pages/ProfilePage';
import AuthRoute from './components/auth/AuthRoute';
import Layout from './components/layout/Layout';
import ListFavoritesPage from './pages/ListFavoritesPage';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2',
    },
    secondary: {
      main: '#009688',
    },
    error: {
      main: '#F44336',
    },
    warning: {
      main: '#FF9800',
    },
    success: {
      main: '#4CAF50',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    body1: {
      lineHeight: 1.5,
    },
    body2: {
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  const { isAuthenticated } = getAuthStore();
  
  useEffect(() => {
    initializeAuth();
  }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <AuthRoute>
                <DashboardPage />
              </AuthRoute>
            } />
            
            <Route path="/files" element={
              <AuthRoute>
                <FilesPage />
              </AuthRoute>
            } />
            
            <Route path="/files/:id" element={
              <AuthRoute>
                <FileDetailPage />
              </AuthRoute>
            } />
            
            <Route path="/shared" element={
              <AuthRoute>
                <SharedPage />
              </AuthRoute>
            } />
            
            <Route path="/trash" element={
              <AuthRoute>
                <TrashPage />
              </AuthRoute>
            } />

            <Route path="/favorites" element={
              <AuthRoute>
                <ListFavoritesPage />
              </AuthRoute>
            } />            


            <Route path="/profile" element={
              <AuthRoute>
                <ProfilePage />
              </AuthRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;