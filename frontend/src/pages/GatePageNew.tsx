import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateService } from '../services/api';
import PageWrapper from '../components/PageWrapper';
import { Gate, GateFormData } from '../types';
import logger from '../utils/logger';

const GatePageNew: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGate, setEditingGate] = useState<Gate | null>(null);
  const [formData, setFormData] = useState<GateFormData>({
    name: '',
    type: 'ENTRY',
    location: '',
    description: '',
    gate_number: '',
    status: 'INACTIVE'
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Gates query
  const { data: gates = [], isLoading, error, refetch } = useQuery<Gate[], Error>({
    queryKey: ['gates'],
    queryFn: async () => {
      const response = await gateService.getAll();
      return response;
    },
    onError: (error: Error) => {
      logger.error('Failed to load gates', error, 'GatePageNew');
      setSnackbar({
        open: true,
        message: 'Failed to load gates. Please try again.',
        severity: 'error'
      });
    }
  });

  // Create gate mutation
  const createGateMutation = useMutation({
    mutationFn: (data: GateFormData) => {
      // Format data sesuai dengan yang diharapkan API
      const gateData = {
        name: data.name,
        type: data.type,
        location: data.location || '',
        description: data.description || '',
        status: 'INACTIVE', // Selalu set INACTIVE untuk gate baru
        gate_number: data.gate_number
      };
      console.log('Creating gate with data:', gateData);
      return gateService.create(gateData);
    },
    onSuccess: (response) => {
      console.log('Gate created successfully:', response);
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      handleCloseDialog();
      showSnackbar('Gate created successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Error creating gate:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error creating gate';
      showSnackbar(errorMessage, 'error');
    }
  });

  // Update gate mutation
  const updateGateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GateFormData }) => {
      // Format data sesuai dengan yang diharapkan API
      const updateData = {
        name: data.name,
        type: data.type,
        location: data.location || '',
        description: data.description || '',
        status: data.status,
        gate_number: data.gate_number
      };
      return gateService.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      handleCloseDialog();
      showSnackbar('Gate updated successfully', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating gate';
      showSnackbar(errorMessage, 'error');
      console.error('Update error:', error);
    }
  });

  // Delete gate mutation
  const deleteGateMutation = useMutation({
    mutationFn: (id: number) => gateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      showSnackbar('Gate deleted successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.message || 'Error deleting gate', 'error');
    }
  });

  // Change gate status mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      // Map status values sesuai dengan yang diharapkan API
      const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      return gateService.changeStatus(id, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      showSnackbar('Gate status changed successfully', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Error changing gate status';
      showSnackbar(errorMessage, 'error');
      console.error('Status change error:', error);
    }
  });

  const handleOpenDialog = (gate?: Gate) => {
    if (gate) {
      setEditingGate(gate);
      setFormData({
        name: gate.name,
        type: gate.type,
        location: gate.location || '',
        description: gate.description || '',
        gate_number: gate.gate_number,
        status: gate.status
      });
    } else {
      setEditingGate(null);
      setFormData({
        name: '',
        type: 'ENTRY',
        location: '',
        description: '',
        gate_number: '',
        status: 'INACTIVE'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGate(null);
    setFormData({
      name: '',
      type: 'ENTRY',
      location: '',
      description: '',
      gate_number: '',
      status: 'INACTIVE'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', formData);
    
    // Validasi data
    if (!formData.name || !formData.type || !formData.gate_number) {
      showSnackbar('Name, type, and gate number are required', 'error');
      return;
    }

    if (editingGate) {
      updateGateMutation.mutate({ id: editingGate.id, data: formData });
    } else {
      createGateMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this gate?')) {
      deleteGateMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    changeStatusMutation.mutate({ id, status: newStatus });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageWrapper title="Gate Management">
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Gate Management</Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              sx={{ mr: 2 }}
            >
              REFRESH
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              ADD GATE
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load gates. Please try again later.
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : gates.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No gates found. Click ADD GATE to create one.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {gates.map((gate: Gate) => (
              <Grid item xs={12} sm={6} md={4} key={gate.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{gate.name}</Typography>
                      <Box>
                        <IconButton
                          color={gate.status === 'ACTIVE' ? 'success' : 'default'}
                          onClick={() => handleToggleStatus(gate.id, gate.status)}
                        >
                          <PowerIcon />
                        </IconButton>
                        <IconButton color="primary" onClick={() => handleOpenDialog(gate)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(gate.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography color="textSecondary" gutterBottom>
                      Gate Number: {gate.gate_number}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Type: {gate.type}
                    </Typography>
                    {gate.location && (
                      <Typography color="textSecondary" gutterBottom>
                        Location: {gate.location}
                      </Typography>
                    )}
                    <Typography
                      color={gate.status === 'ACTIVE' ? 'success.main' : 'error.main'}
                      gutterBottom
                    >
                      Status: {gate.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>{editingGate ? 'Edit Gate' : 'Add New Gate'}</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Gate Number"
                  value={formData.gate_number}
                  onChange={(e) => setFormData({ ...formData, gate_number: e.target.value })}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ENTRY' | 'EXIT' })}
                    required
                  >
                    <MenuItem value="ENTRY">Entry</MenuItem>
                    <MenuItem value="EXIT">Exit</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                {editingGate && (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      required
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingGate ? 'Save Changes' : 'Add Gate'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageWrapper>
  );
};

export default GatePageNew; 