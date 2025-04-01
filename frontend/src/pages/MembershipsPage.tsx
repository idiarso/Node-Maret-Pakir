import { useState, FC } from 'react';
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
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { membershipService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Membership } from '../types';

const membershipTypes = ['Regular', 'Silver', 'Gold', 'Platinum', 'Corporate'];
const vehicleTypes = ['Car', 'Motorcycle', 'Truck'];

const MembershipsPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [formData, setFormData] = useState<Partial<Membership>>({
    customerName: '',
    membershipType: '',
    vehiclePlate: '',
    vehicleType: '',
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    status: 'ACTIVE',
    discountRate: 10
  });
  
  const queryClient = useQueryClient();
  
  const { 
    data: memberships = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['memberships'],
    queryFn: membershipService.getAll
  });

  const createMembershipMutation = useMutation({
    mutationFn: (data: Partial<Membership>) => membershipService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      handleCloseDialog();
    }
  });

  const updateMembershipMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Membership> }) => 
      membershipService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      handleCloseDialog();
    }
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: (id: number) => membershipService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    }
  });

  const handleOpenDialog = (membership?: Membership) => {
    if (membership) {
      setSelectedMembership(membership);
      setFormData(membership);
    } else {
      setSelectedMembership(null);
      setFormData({
        customerName: '',
        membershipType: '',
        vehiclePlate: '',
        vehicleType: '',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: 'ACTIVE',
        discountRate: 10
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMembership(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = () => {
    if (selectedMembership) {
      updateMembershipMutation.mutate({ id: selectedMembership.id, data: formData });
    } else {
      createMembershipMutation.mutate(formData);
    }
  };

  const handleDeleteMembership = (id: number) => {
    if (window.confirm('Are you sure you want to delete this membership?')) {
      deleteMembershipMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID');
  };

  const filteredMemberships = memberships.filter(membership => 
    membership.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membership.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membership.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Memberships
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            disabled={isLoading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Membership
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage parking memberships in the system.
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff4f4' }}>
          <Typography color="error">Error loading memberships</Typography>
        </Paper>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name, membership number, or license plate"
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
        ) : filteredMemberships.length === 0 ? (
          <Typography>No memberships found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Membership #</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Vehicle Plate</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMemberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>{membership.membershipNumber}</TableCell>
                    <TableCell>{membership.customerName}</TableCell>
                    <TableCell>{membership.membershipType}</TableCell>
                    <TableCell>{membership.vehiclePlate}</TableCell>
                    <TableCell>{formatDate(membership.startDate)}</TableCell>
                    <TableCell>{formatDate(membership.endDate)}</TableCell>
                    <TableCell>{membership.discountRate}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={membership.status} 
                        color={getStatusColor(membership.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenDialog(membership)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteMembership(membership.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMembership ? 'Edit Membership' : 'Add New Membership'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Customer Name"
              name="customerName"
              value={formData.customerName || ''}
              onChange={handleInputChange}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="membership-type-label">Membership Type</InputLabel>
              <Select
                labelId="membership-type-label"
                name="membershipType"
                value={formData.membershipType || ''}
                label="Membership Type"
                onChange={handleInputChange}
              >
                {membershipTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              label="Vehicle Plate"
              name="vehiclePlate"
              value={formData.vehiclePlate || ''}
              onChange={handleInputChange}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
              <Select
                labelId="vehicle-type-label"
                name="vehicleType"
                value={formData.vehicleType || ''}
                label="Vehicle Type"
                onChange={handleInputChange}
              >
                {vehicleTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              margin="normal"
              fullWidth
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Discount Rate (%)"
              name="discountRate"
              type="number"
              value={formData.discountRate || ''}
              onChange={handleInputChange}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status || ''}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="EXPIRED">Expired</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={createMembershipMutation.isPending || updateMembershipMutation.isPending}
          >
            {selectedMembership ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MembershipsPage; 