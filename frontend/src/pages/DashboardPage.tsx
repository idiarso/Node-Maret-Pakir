import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  LocalParking as ParkingIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import {
  dashboardService,
  DashboardData,
  DashboardResponse,
  checkServerConnection,
  ApiError,
  resetServerConnectionStatus
} from '../services/api'; // Tambahkan resetServerConnectionStatus
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { translate } = useLanguage();
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const checkConnection = async () => {
    try {
      const isConnected = await checkServerConnection();
      setIsServerConnected(isConnected);
      return isConnected;
    } catch (error) {
      setIsServerConnected(false);
      return false;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset server connection status when user manually tries to connect
      resetServerConnectionStatus();
      
      // First check if server is available
      const isConnected = await checkConnection();
      if (!isConnected) {
        setError('Server tidak tersedia. Silahkan cek koneksi jaringan atau status server.');
        setLoading(false);
        return;
      }
      
      // Check authentication before fetching data
      await checkAuth();
      
      const data = await dashboardService.getData();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.isConnectionError) {
        setError('Tidak dapat terhubung ke server. Silahkan periksa koneksi Anda.');
        setIsServerConnected(false);
      } else if (error.response?.status === 401 || error.message?.includes('Unauthorized')) {
        setError('Anda perlu login untuk melihat dashboard');
        // Redirect ke halaman login jika user belum login
        if (!user) {
          navigate('/login');
        }
      } else {
        setError(`Error mengambil data: ${error.response?.data?.message || error.message || 'Server error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling to check server connection every 30 seconds
    const intervalId = setInterval(() => {
      if (!isServerConnected) {
        checkConnection().then(isConnected => {
          if (isConnected) {
            fetchDashboardData();
          }
        });
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isServerConnected]);

  const handleResetData = async () => {
    try {
      // Reset connection status before checking
      resetServerConnectionStatus();
      
      const isConnected = await checkConnection();
      if (!isConnected) {
        setSnackbar({
          open: true,
          message: 'Server tidak tersedia. Silahkan cek koneksi jaringan atau status server.',
          severity: 'error',
        });
        setConfirmOpen(false);
        return;
      }
      
      const response = await dashboardService.resetData();
      if (response.success) {
        setDashboardData(response.data);
        setSnackbar({
          open: true,
          message: translate('dataResetSuccess'),
          severity: 'success',
        });
      }
    } catch (error: any) {
      console.error('Error resetting dashboard data:', error);
      setSnackbar({
        open: true,
        message: error.isConnectionError 
          ? 'Tidak dapat terhubung ke server. Silahkan periksa koneksi Anda.'
          : error.response?.data?.message || error.message || 'Error resetting data',
        severity: 'error',
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  // Error component for better visualization
  const ErrorDisplay = () => (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        bgcolor: 'error.light',
        color: 'error.contrastText'
      }}
    >
      {!isServerConnected ? (
        <WifiOffIcon sx={{ fontSize: 60, mb: 2 }} />
      ) : (
        <ErrorIcon sx={{ fontSize: 60, mb: 2 }} />
      )}
      <Typography variant="h5" gutterBottom align="center">
        {!isServerConnected ? 'Koneksi Server Terputus' : 'Error'}
      </Typography>
      <Typography align="center" sx={{ mb: 3 }}>
        {error}
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchDashboardData}
        startIcon={<RefreshIcon />}
      >
        Coba Lagi
      </Button>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', p: 3 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, width: '100%' }}>
        <ErrorDisplay />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {translate('welcomeMessage')}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {translate('parkingSystemDashboard')}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="warning" 
          startIcon={<RefreshIcon />}
          onClick={() => setConfirmOpen(true)}
          disabled={!isServerConnected}
        >
          {translate('resetData')}
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={translate('activeTickets')}
            value={dashboardData?.activeTickets || 0}
            icon={<ParkingIcon sx={{ color: '#1976d2' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={translate('totalRevenue')}
            value={`Rp ${(dashboardData?.todayRevenue || 0).toLocaleString()}`}
            icon={<PaymentIcon sx={{ color: '#2e7d32' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={translate('averageDuration')}
            value={dashboardData?.averageDuration || '0h'}
            icon={<AccessTimeIcon sx={{ color: '#ed6c02' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={translate('totalTickets')}
            value={dashboardData?.totalTickets || 0}
            icon={<TrendingUpIcon sx={{ color: '#9c27b0' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>{translate('resetData')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {translate('confirmReset')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {translate('cancel')}
          </Button>
          <Button onClick={handleResetData} color="warning" autoFocus>
            {translate('resetData')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardPage; 