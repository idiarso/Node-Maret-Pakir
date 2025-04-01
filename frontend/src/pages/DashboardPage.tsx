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
} from '@mui/material';
import {
  LocalParking as ParkingIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardData {
  activeTickets: number;
  totalTickets: number;
  availableSpots: number;
  totalCapacity: number;
  occupancyRate: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageDuration: string;
  peakHours: string[];
  totalVehicles: number;
  vehicleTypes: {
    car: number;
    motorcycle: number;
    truck: number;
  };
  deviceStatus: {
    online: number;
    offline: number;
    maintenance: number;
  };
  recentTransactions: Array<{
    id: number;
    licensePlate: string;
    amount: number;
    vehicleType: string;
    timestamp: string;
    duration: string;
  }>;
}

interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

const DashboardPage: React.FC = () => {
  const { translate } = useLanguage();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<DashboardData>('http://localhost:3000/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetData = async () => {
    try {
      const response = await axios.post<DashboardResponse>('http://localhost:3000/api/dashboard/reset');
      if (response.data.success) {
        setDashboardData(response.data.data);
        setSnackbar({
          open: true,
          message: translate('dataResetSuccess'),
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Error resetting dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Error resetting data',
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading...</Typography>
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