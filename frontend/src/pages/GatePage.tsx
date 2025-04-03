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

interface GateFormData {
  name: string;
  type: 'ENTRY' | 'EXIT';
  location?: string;
  description?: string;
  status: string;
}

const GatePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGate, setEditingGate] = useState<any>(null);
  const [formData, setFormData] = useState<GateFormData>({
    name: '',
    type: 'ENTRY',
    location: '',
    description: '',
    status: 'ACTIVE'
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
  const { data: gates, isLoading, error, refetch } = useQuery({
    queryKey: ['gates'],
    queryFn: async () => {
      try {
        const response = await gateService.getAll();
        return response;
      } catch (error) {
        console.error('Error fetching gates:', error);
        throw error;
      }
    }
  });

  // Create gate mutation
  const createGateMutation = useMutation({
    mutationFn: (data: GateFormData) => gateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      handleCloseDialog();
      showSnackbar('Gate created successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.message || 'Error creating gate', 'error');
    }
  });

  // Update gate mutation
  const updateGateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GateFormData }) =>
      gateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      handleCloseDialog();
      showSnackbar('Gate updated successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.message || 'Error updating gate', 'error');
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
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      gateService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      showSnackbar('Gate status changed successfully', 'success');
    },
    onError: (error: any) => {
      showSnackbar(error.message || 'Error changing gate status', 'error');
    }
  });

  const handleOpenDialog = (gate?: any) => {
    if (gate) {
      setEditingGate(gate);
      setFormData({
        name: gate.name,
        type: gate.type,
        location: gate.location || '',
        description: gate.description || '',
        status: gate.status || 'ACTIVE'
      });
    } else {
      setEditingGate(null);
      setFormData({
        name: '',
        type: 'ENTRY',
        location: '',
        description: '',
        status: 'ACTIVE'
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
      status: 'ACTIVE'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              Add Gate
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load gates. Please try again later.
          </Alert>
        )}

        <Grid container spacing={3}>
          {gates?.map((gate: any) => (
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

        {/* Gate Form Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>{editingGate ? 'Edit Gate' : 'Add New Gate'}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                />
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ENTRY' | 'EXIT' })}
                  >
                    <MenuItem value="ENTRY">Entry</MenuItem>
                    <MenuItem value="EXIT">Exit</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                    <MenuItem value="ERROR">Error</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={createGateMutation.isPending || updateGateMutation.isPending}
              >
                {createGateMutation.isPending || updateGateMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : editingGate ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageWrapper>
  );
};

export default GatePage; 