import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getTickets } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Ticket } from '../types/ticket';

const ParkingPage: React.FC = () => {
  const { data: tickets, isLoading, error } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: getTickets
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading tickets</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Parking Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket ID</TableCell>
              <TableCell>Plate Number</TableCell>
              <TableCell>Entry Time</TableCell>
              <TableCell>Exit Time</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets?.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.id}</TableCell>
                <TableCell>{ticket.plateNumber}</TableCell>
                <TableCell>{new Date(ticket.entryTime).toLocaleString()}</TableCell>
                <TableCell>
                  {ticket.exitTime ? new Date(ticket.exitTime).toLocaleString() : '-'}
                </TableCell>
                <TableCell>{ticket.fee || '-'}</TableCell>
                <TableCell>{ticket.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParkingPage; 