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

  const todayGrowth = data?.todayGrowth ?? 0;
  const monthGrowth = data?.monthGrowth ?? 0;

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
            color={todayGrowth >= 0 ? 'success.main' : 'error.main'}
          >
            {todayGrowth >= 0 ? '+' : ''}{todayGrowth}% vs yesterday
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
            color={monthGrowth >= 0 ? 'success.main' : 'error.main'}
          >
            {monthGrowth >= 0 ? '+' : ''}{monthGrowth}% vs last month
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