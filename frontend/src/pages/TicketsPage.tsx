import { useState, useEffect, FC } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import { getTickets, updateTicket } from '../services/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

interface Ticket {
  id: string;
  ticketNumber: string;
  licensePlate: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  status: string;
  amount: number;
}

const TicketsPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  
  const { 
    data: tickets = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: getTickets
  });

  const payTicketMutation = useMutation({
    mutationFn: (id: string) => updateTicket(id, { status: 'PAID' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handlePayTicket = async (id: string) => {
    try {
      await payTicketMutation.mutateAsync(id);
    } catch (err) {
      console.error('Error paying ticket:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'warning';
      case 'PAID':
        return 'success';
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Tickets
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage and view parking tickets in the system.
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff4f4' }}>
          <Typography color="error">Error loading tickets</Typography>
        </Paper>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by ticket number, license plate or vehicle type"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper sx={{ p: 3, mt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredTickets.length === 0 ? (
          <Typography>No tickets found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket Number</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Vehicle Type</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.licensePlate}</TableCell>
                    <TableCell>{ticket.vehicleType}</TableCell>
                    <TableCell>{new Date(ticket.entryTime).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={ticket.status} 
                        color={getStatusColor(ticket.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {ticket.amount ? `Rp ${ticket.amount.toLocaleString('id-ID')}` : '-'}
                    </TableCell>
                    <TableCell>
                      {ticket.status === 'UNPAID' && (
                        <Tooltip title="Process Payment">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handlePayTicket(ticket.id)}
                            disabled={payTicketMutation.isPending}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default TicketsPage; 