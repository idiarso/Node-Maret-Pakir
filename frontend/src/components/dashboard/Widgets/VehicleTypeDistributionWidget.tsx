import React from 'react';
import { Box, Typography } from '@mui/material';
import { DirectionsCar as CarIcon } from '@mui/icons-material';
import { DashboardCard } from '../../Card/DashboardCard';
import { useQuery } from '@tanstack/react-query';
import { getVehicleDistribution, VehicleDistribution } from '../../../api/vehicles';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';

interface ChartItem {
  id: string;
  value: number;
  label: string;
  color: string;
}

export const VehicleTypeDistributionWidget: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<VehicleDistribution[]>({
    queryKey: ['vehicleDistribution'],
    queryFn: getVehicleDistribution,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const chartData = data?.map(item => ({
    id: item.type,
    value: item.count,
    label: item.type,
    color: item.color,
  })) ?? [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <DashboardCard
      title="Vehicle Distribution"
      subtitle={`Total Vehicles: ${total}`}
      icon={<CarIcon color="primary" />}
      loading={isLoading}
      error={error instanceof Error ? error.message : 'An error occurred'}
      showRefresh
      onRefresh={() => refetch()}
    >
      <Box sx={{ 
        width: '100%',
        height: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {chartData.length > 0 ? (
          <PieChart
            series={[
              {
                data: chartData,
                arcLabel: (item: ChartItem) => 
                  `${item.label} (${Math.round((item.value / total) * 100)}%)`,
                arcLabelMinAngle: 45,
              },
            ]}
            sx={{
              [`& .${pieArcLabelClasses.root}`]: {
                fill: 'text.primary',
                fontSize: 14,
              },
            }}
            width={400}
            height={300}
            margin={{ right: 100 }}
            legend={{ hidden: true }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 10 }}>
            No data available
          </Typography>
        )}
      </Box>
    </DashboardCard>
  );
}; 