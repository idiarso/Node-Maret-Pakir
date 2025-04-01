import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { AttachMoney as MoneyIcon } from '@mui/icons-material';
import { DashboardCard } from '../../Card/DashboardCard';
import { useQuery } from '@tanstack/react-query';
import { getRevenueStatistics, RevenueStatistics } from '../../../api/revenue';

export const RevenueWidget: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<RevenueStatistics>({
    queryKey: ['revenueStatistics'],
    queryFn: getRevenueStatistics,
    refetchInterval: 60000, // Refetch every minute
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardCard
      title="Revenue Overview"
      subtitle="Today's earnings and comparisons"
      icon={<MoneyIcon color="primary" />}
      loading={isLoading}
      error={error instanceof Error ? error.message : 'An error occurred'}
      showRefresh
      onRefresh={() => refetch()}
      showDownload
    >
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Today's Revenue
          </Typography>
          <Typography variant="h4" color="primary">
            {formatCurrency(data?.todayRevenue ?? 0)}
          </Typography>
          <Typography
            variant="body2"
            color={data?.todayGrowth >= 0 ? 'success.main' : 'error.main'}
          >
            {data?.todayGrowth >= 0 ? '+' : ''}{data?.todayGrowth ?? 0}% vs yesterday
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            This Month
          </Typography>
          <Typography variant="h5">
            {formatCurrency(data?.monthRevenue ?? 0)}
          </Typography>
          <Typography
            variant="body2"
            color={data?.monthGrowth >= 0 ? 'success.main' : 'error.main'}
          >
            {data?.monthGrowth >= 0 ? '+' : ''}{data?.monthGrowth ?? 0}% vs last month
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Outstanding Payments
          </Typography>
          <Typography variant="h6" color="warning.main">
            {formatCurrency(data?.outstandingPayments ?? 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.pendingPayments ?? 0} pending transactions
          </Typography>
        </Box>
      </Stack>
    </DashboardCard>
  );
}; 