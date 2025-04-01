import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { LocalParking as ParkingIcon } from '@mui/icons-material';
import { DashboardCard } from '../../Card/DashboardCard';
import { useQuery } from '@tanstack/react-query';
import { getParkingStatistics, ParkingStatistics } from '../../../api/parking';

export const ParkingOccupancyWidget: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<ParkingStatistics>({
    queryKey: ['parkingStatistics'],
    queryFn: getParkingStatistics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const occupancyRate = data ? Math.round((data.occupied / data.capacity) * 100) : 0;
  const getOccupancyColor = (rate: number): 'error' | 'warning' | 'success' => {
    if (rate >= 90) return 'error';
    if (rate >= 70) return 'warning';
    return 'success';
  };

  const color = getOccupancyColor(occupancyRate);
  const availableSpaces = data ? data.capacity - data.occupied : 0;

  return (
    <DashboardCard
      title="Parking Occupancy"
      subtitle={`${data?.occupied ?? 0} of ${data?.capacity ?? 0} spaces occupied`}
      icon={<ParkingIcon color="primary" />}
      loading={isLoading}
      error={error instanceof Error ? error.message : 'An error occurred'}
      showRefresh
      onRefresh={() => refetch()}
    >
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Occupancy Rate
          </Typography>
          <Typography variant="body2" color={color}>
            {occupancyRate}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={occupancyRate}
          color={color}
          sx={{ height: 10, borderRadius: 1 }}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Available Spaces: {availableSpaces}
          </Typography>
        </Box>
      </Box>
    </DashboardCard>
  );
}; 