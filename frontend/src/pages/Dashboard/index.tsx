import React from 'react';
import { Box, Container } from '@mui/material';
import {
  ParkingOccupancyWidget,
  RevenueWidget,
  VehicleTypeDistributionWidget,
  RecentActivityWidget,
} from '../../components/dashboard/Widgets';

export const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'grid', gap: 3 }}>
        {/* First row */}
        <Box sx={{ 
          display: 'grid', 
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: '1fr 1fr 2fr',
          },
        }}>
          <Box>
            <ParkingOccupancyWidget />
          </Box>
          <Box>
            <RevenueWidget />
          </Box>
          <Box>
            <VehicleTypeDistributionWidget />
          </Box>
        </Box>

        {/* Second row */}
        <Box>
          <RecentActivityWidget />
        </Box>
      </Box>
    </Container>
  );
}; 