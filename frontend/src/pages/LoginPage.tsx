import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  WifiOff as WifiOffIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { checkServerConnection, resetServerConnectionStatus } from '../services/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Check server connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkServerConnection();
        setIsServerAvailable(isConnected);
        if (!isConnected) {
          setError('Tidak dapat terhubung ke server. Silahkan periksa koneksi server Anda.');
        }
      } catch (error) {
        setIsServerAvailable(false);
        setError('Tidak dapat terhubung ke server. Silahkan periksa koneksi server Anda.');
      }
    };
    
    checkConnection();
    
    // Set up polling to check server connection every 30 seconds if server is down
    const intervalId = setInterval(() => {
      if (!isServerAvailable) {
        checkConnection();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [isServerAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isServerAvailable) {
      setError('Server tidak tersedia. Silahkan periksa koneksi server Anda.');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.isConnectionError) {
        setError('Tidak dapat terhubung ke server. Silahkan periksa koneksi server Anda.');
        setIsServerAvailable(false);
      } else if (err.response?.status === 401) {
        setError('Username atau password salah.');
      } else {
        setError(err.response?.data?.message || 'Login gagal. Silahkan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleRetryConnection = async () => {
    setIsLoading(true);
    try {
      // Reset server connection status to force a fresh check
      resetServerConnectionStatus();
      
      const isConnected = await checkServerConnection();
      setIsServerAvailable(isConnected);
      if (isConnected) {
        setError(null);
      } else {
        setError('Tidak dapat terhubung ke server. Silahkan periksa koneksi server Anda.');
      }
    } catch (error) {
      setIsServerAvailable(false);
      setError('Tidak dapat terhubung ke server. Silahkan periksa koneksi server Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Server error component
  const ServerError = () => (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'error.light',
        color: 'error.contrastText',
        mb: 4,
      }}
    >
      <WifiOffIcon sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h5" gutterBottom align="center">
        Koneksi Server Terputus
      </Typography>
      <Typography align="center" paragraph>
        {error}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleRetryConnection}
        startIcon={<RefreshIcon />}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Coba Lagi'}
      </Button>
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        {!isServerAvailable ? (
          <ServerError />
        ) : (
          <Card
            elevation={4}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                bgcolor: 'primary.main',
                py: 3,
                px: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" color="white" gutterBottom>
                Parking System
              </Typography>
              <Typography variant="subtitle1" color="white">
                Sign in to your account
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 4 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 4 }}
        >
          © {new Date().getFullYear()} Parking System. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage; 