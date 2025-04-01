import React from 'react';
import { Grid, Box } from '@mui/material';
import StatCard from '../StatCard';
import {
  LocalParking as ParkingIcon,
  ExitToApp as ExitIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface DashboardStatsData {
  vehiclesIn: number;
  vehiclesOut: number;
  dailyRevenue: number;
  parkingCapacity: {
    total: number;
    available: number;
  };
}

const DashboardStats: React.FC = () => {
  const { token } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStatsData>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const occupancyRate = stats
    ? ((stats.parkingCapacity.total - stats.parkingCapacity.available) / stats.parkingCapacity.total) * 100
    : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Vehicles In"
          value={stats?.vehiclesIn || 0}
          icon={<ParkingIcon sx={{ color: '#1976d2' }} />}
          color="#1976d2"
          subtitle="Today"
          trend={{
            value: 5,
            label: "vs yesterday",
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Vehicles Out"
          value={stats?.vehiclesOut || 0}
          icon={<ExitIcon sx={{ color: '#2e7d32' }} />}
          color="#2e7d32"
          subtitle="Today"
          trend={{
            value: -2,
            label: "vs yesterday",
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Daily Revenue"
          value={`$${stats?.dailyRevenue.toFixed(2) || '0.00'}`}
          icon={<MoneyIcon sx={{ color: '#ed6c02' }} />}
          color="#ed6c02"
          subtitle="Today"
          trend={{
            value: 8,
            label: "vs yesterday",
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Parking Capacity"
          value={`${stats?.parkingCapacity.available || 0}/${stats?.parkingCapacity.total || 0}`}
          icon={<CarIcon sx={{ color: '#9c27b0' }} />}
          color="#9c27b0"
          subtitle="Available/Total"
          progress={occupancyRate}
          tooltip={`${occupancyRate.toFixed(1)}% occupancy rate`}
        />
      </Grid>
    </Grid>
  );
};

export default DashboardStats; 