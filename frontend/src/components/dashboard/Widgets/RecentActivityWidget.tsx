import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Chip,
  Avatar,
} from '@mui/material';
import {
  History as HistoryIcon,
  DirectionsCar as CarIcon,
  LocalParking as ParkingIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { DashboardCard } from '../../Card/DashboardCard';
import { useQuery } from '@tanstack/react-query';
import { getRecentActivity, ParkingActivity } from '../../../api/activity';
import { formatDistanceToNow } from 'date-fns';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'entry':
      return <CarIcon color="success" />;
    case 'exit':
      return <CarIcon color="error" />;
    case 'payment':
      return <PaymentIcon color="primary" />;
    default:
      return <ParkingIcon />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'entry':
      return 'success';
    case 'exit':
      return 'error';
    case 'payment':
      return 'primary';
    default:
      return 'default';
  }
};

export const RecentActivityWidget: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<ParkingActivity[]>({
    queryKey: ['recentActivity'],
    queryFn: getRecentActivity,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return (
    <DashboardCard
      title="Recent Activity"
      subtitle="Latest parking events"
      icon={<HistoryIcon color="primary" />}
      loading={isLoading}
      error={error instanceof Error ? error.message : 'An error occurred'}
      showRefresh
      onRefresh={() => refetch()}
    >
      <List sx={{ width: '100%', mt: 1 }}>
        {data?.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              }
            />
          </ListItem>
        )}
        {data?.map((activity) => (
          <ListItem
            key={activity.id}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <ListItemIcon>
              {getActivityIcon(activity.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {activity.vehiclePlate}
                  </Typography>
                  <Chip
                    size="small"
                    label={activity.type.toUpperCase()}
                    color={getActivityColor(activity.type) as any}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {activity.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </Typography>
                </Box>
              }
            />
            {activity.amount && (
              <Chip
                label={`$${activity.amount.toFixed(2)}`}
                color="primary"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </DashboardCard>
  );
}; 