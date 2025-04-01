import React from 'react';
import { Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

const RevenueChart: React.FC = () => {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data: revenueData, isLoading } = useQuery<RevenueData>({
    queryKey: ['revenueData', timeRange],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:3000/api/dashboard/revenue?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Revenue Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Revenue Analysis
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, newRange) => newRange && setTimeRange(newRange)}
            size="small"
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {isLoading ? (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : revenueData ? (
          <Box sx={{ height: 300 }}>
            <Line options={options} data={revenueData} />
          </Box>
        ) : (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>No data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart; 