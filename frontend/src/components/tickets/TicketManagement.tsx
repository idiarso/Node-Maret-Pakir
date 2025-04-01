import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface Ticket {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  entryTime: string;
  entryGate: string;
  exitTime?: string;
  exitGate?: string;
  fee?: number;
  status: 'active' | 'completed' | 'cancelled';
}

const TicketManagement: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<Ticket['status'] | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Ticket>>({
    vehicleNumber: '',
    vehicleType: '',
    entryTime: new Date().toISOString(),
    entryGate: '',
    status: 'active',
  });

  const { data: tickets = [], isLoading } = useQuery<Ticket[], Error>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const response = await axios.get<Ticket[]>('http://localhost:3000/api/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const updateTicketMutation = useMutation<Ticket, Error, Ticket>({
    mutationFn: async (ticket: Ticket) => {
      const response = await axios.put<Ticket>(
        `http://localhost:3000/api/tickets/${ticket.id}`,
        ticket,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      handleCloseDialog();
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, ticket: Ticket) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTicket(null);
  };

  const handleEdit = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting tickets...');
  };

  const handleOpenDialog = (ticket?: Ticket) => {
    if (ticket) {
      setSelectedTicket(ticket);
      setFormData(ticket);
    } else {
      setSelectedTicket(null);
      setFormData({
        vehicleNumber: '',
        vehicleType: '',
        entryTime: new Date().toISOString(),
        entryGate: '',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
    setFormData({
      vehicleNumber: '',
      vehicleType: '',
      entryTime: new Date().toISOString(),
      entryGate: '',
      status: 'active',
    });
  };

  const handleSubmit = () => {
    if (selectedTicket) {
      updateTicketMutation.mutate({ ...selectedTicket, ...formData } as Ticket);
    }
  };

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesSearch =
      ticket.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.entryGate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

    const matchesDateRange =
      (!dateRange.start || new Date(ticket.entryTime) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(ticket.entryTime) <= new Date(dateRange.end));

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleFilterStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterStatus(event.target.value as Ticket['status'] | 'all');
  };

  const handleDateRangeChange = (field: 'start' | 'end') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDateRange((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Ticket Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
            startIcon={<AddIcon />}
          >
            Add Ticket
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by vehicle number, type, or gate..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={handleFilterStatusChange}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Start Date"
            value={dateRange.start}
            onChange={handleDateRangeChange('start')}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="End Date"
            value={dateRange.end}
            onChange={handleDateRangeChange('end')}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>Vehicle Type</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Entry Gate</TableCell>
                <TableCell>Exit Time</TableCell>
                <TableCell>Exit Gate</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Loading tickets...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket: Ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell>{ticket.vehicleNumber}</TableCell>
                    <TableCell>{ticket.vehicleType}</TableCell>
                    <TableCell>{new Date(ticket.entryTime).toLocaleString()}</TableCell>
                    <TableCell>{ticket.entryGate}</TableCell>
                    <TableCell>{ticket.exitTime ? new Date(ticket.exitTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{ticket.exitGate || '-'}</TableCell>
                    <TableCell>{ticket.fee ? `$${ticket.fee.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleMenuClick(e, ticket)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedTicket ? 'Edit Ticket' : 'Add Ticket'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Vehicle Type"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Entry Gate"
                  value={formData.entryGate}
                  onChange={(e) => setFormData({ ...formData, entryGate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Ticket['status'] })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={updateTicketMutation.isPending}
            >
              {updateTicketMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TicketManagement; 