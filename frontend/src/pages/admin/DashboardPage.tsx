import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  totalRevenue: number;
  totalUsers: number;
}

interface RevenueData {
  date: string;
  amount: number;
}

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
  });

  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useQuery<RevenueData[]>({
    queryKey: ['revenueData'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch('/api/dashboard/revenue');
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      return response.json();
    },
  });

  if (statsError || revenueError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Gagal memuat data dashboard. Silakan coba lagi nanti.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {/* Total Vehicles */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CarIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Kendaraan</Typography>
            </Box>
            {statsLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4">{stats?.totalVehicles || 0}</Typography>
            )}
          </CardContent>
        </Card>

        {/* Active Vehicles */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimelineIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Kendaraan Aktif</Typography>
            </Box>
            {statsLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" color="success.main">
                {stats?.activeVehicles || 0}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MoneyIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Pendapatan</Typography>
            </Box>
            {statsLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" color="info.main">
                Rp {stats?.totalRevenue?.toLocaleString('id-ID') || 0}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Pengguna</Typography>
            </Box>
            {statsLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" color="warning.main">
                {stats?.totalUsers || 0}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Revenue Chart */}
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Grafik Pendapatan
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          {revenueLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <ResponsiveContainer>
              <LineChart
                data={revenueData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => format(new Date(value), 'dd MMM', { locale: id })}
                />
                <YAxis
                  tickFormatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  labelFormatter={(label: string) => format(new Date(label), 'dd MMMM yyyy', { locale: id })}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default DashboardPage; 