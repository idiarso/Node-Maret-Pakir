import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PowerSettingsNew as PowerIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gateService from '../services/gateService';
import { Gate } from '../types';
import logger from '../utils/logger';

// Menggunakan tipe dari gateService untuk menghindari konflik
import { GateFormData } from '../services/gateService';

const GatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editGate, setEditGate] = useState<Gate | null>(null);
  const [formData, setFormData] = useState<GateFormData>({
    name: '',
    gate_number: '',
    location: '',
    type: 'ENTRY',
    description: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch gates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gates'],
    queryFn: async () => {
      try {
        logger.debug('GatesPage: Fetching gates from API...', 'GatesPage');
        console.log('GatesPage: Fetching gates...');
        
        const response = await gateService.getAll();
        logger.debug('GatesPage: Received gates data', 'GatesPage');
        console.log('GatesPage: Gates response data:', response);
        
        // Debug data dari API
        console.log('GatesPage: Data length:', response ? response.length : 0);
        console.log('GatesPage: Verifikasi apakah data array:', Array.isArray(response));
        console.log('GatesPage: Sample data (jika ada):', response?.[0]);
        
        return response || [];
      } catch (error) {
        logger.error('Failed to load gates', error, 'GatesPage');
        console.error('GatesPage: Error fetching gates:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load gates. Please try again.',
          severity: 'error'
        });
        throw error;
      }
    },
    // Refresh data setiap 10 detik
    refetchInterval: 10000
  });
  
  // Ensure gates is always an array
  const gates: Gate[] = Array.isArray(data) ? data : [];

  // Create gate mutation
  const createGateMutation = useMutation<Gate, Error, GateFormData>({
    mutationFn: (data) => {
      // Make sure all required fields are included
      console.log('Creating gate with data:', data);
      const gateData: GateFormData = {
        name: data.name,
        gate_number: data.gate_number || '0',
        location: data.location || '',
        type: data.type || 'ENTRY',
        description: data.description || '',
        status: 'INACTIVE' // Always start with INACTIVE for safety
      };
      return gateService.create(gateData);
    },
    onSuccess: (newGate) => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      setSnackbar({
        open: true,
        message: `Gate "${newGate.name}" created successfully`,
        severity: 'success'
      });
      setOpenDialog(false);
    },
    onError: (error: Error) => {
      logger.error('Error creating gate', error, 'GatesPage');
      console.error('GatesPage: Error creating gate:', error);
      setSnackbar({
        open: true,
        message: `Error creating gate: ${error.message}`,
        severity: 'error'
      });
    }
  });

  // Update gate mutation
  const updateGateMutation = useMutation<Gate, Error, { id: number; data: GateFormData }>({
    mutationFn: ({ id, data }) => {
      // Make sure all required fields are included
      const gateData: GateFormData = {
        name: data.name,
        gate_number: data.gate_number || '0',
        location: data.location || '',
        type: data.type || 'ENTRY',
        description: data.description || '',
        status: data.status
      };
      return gateService.update(id, gateData);
    },
    onSuccess: (updatedGate) => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      setSnackbar({
        open: true,
        message: `Gate "${updatedGate.name}" updated successfully`,
        severity: 'success'
      });
      setOpenDialog(false);
    },
    onError: (error: Error) => {
      logger.error('Error updating gate', error, 'GatesPage');
      console.error('GatesPage: Error updating gate:', error);
      setSnackbar({
        open: true,
        message: `Error updating gate: ${error.message}`,
        severity: 'error'
      });
    }
  });

  // Delete gate mutation
  const deleteGateMutation = useMutation<void, Error, number>({
    mutationFn: (id) => gateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      setSnackbar({
        open: true,
        message: 'Gate deleted successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      logger.error('Error deleting gate', error, 'GatesPage');
      console.error('GatesPage: Error deleting gate:', error);
      setSnackbar({
        open: true,
        message: `Error deleting gate: ${error.message}`,
        severity: 'error'
      });
    }
  });

  const handleOpenDialog = (gate: Gate | null = null) => {
    if (gate) {
      setEditGate(gate);
      setFormData({
        name: gate.name,
        gate_number: gate.gate_number,
        location: gate.location || '',
        type: gate.type as 'ENTRY' | 'EXIT',
        description: gate.description || '',
        status: gate.status
      });
    } else {
      setEditGate(null);
      setFormData({
        name: '',
        gate_number: '',
        location: '',
        type: 'ENTRY',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditGate(null);
    setFormData({
      name: '',
      gate_number: '',
      location: '',
      type: 'ENTRY',
      description: ''
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveGate = () => {
    // Validation
    if (!formData.name) {
      setSnackbar({
        open: true,
        message: 'Gate name is required',
        severity: 'error'
      });
      return;
    }

    if (!formData.gate_number) {
      setSnackbar({
        open: true,
        message: 'Gate number is required',
        severity: 'error'
      });
      return;
    }

    // Create or update gate
    if (editGate) {
      updateGateMutation.mutate({
        id: editGate.id,
        data: formData
      });
    } else {
      createGateMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (gate: Gate) => {
    const newStatus = gate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    gateService.changeStatus(gate.id, newStatus)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['gates'] });
        setSnackbar({
          open: true,
          message: `Gate "${gate.name}" is now ${newStatus}`,
          severity: 'success'
        });
      })
      .catch((error) => {
        console.error('Error toggling gate status:', error);
        setSnackbar({
          open: true,
          message: `Error toggling status: ${error.message}`,
          severity: 'error'
        });
      });
  };

  return (
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

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load gates. Please try again.</Alert>
      ) : gates.length === 0 ? (
        <Alert severity="info" icon={false}>
          <Box display="flex" flexDirection="column" alignItems="center" py={2}>
            <Typography variant="h6" gutterBottom>No gates found</Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Create your first gate by clicking the "ADD GATE" button.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              ADD GATE
            </Button>
          </Box>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {gates.map((gate) => (
            <Grid item xs={12} sm={6} md={4} key={gate.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">{gate.name}</Typography>
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      bgcolor: gate.status === 'ACTIVE' ? 'success.light' : 'error.light',
                      color: gate.status === 'ACTIVE' ? 'success.contrastText' : 'error.contrastText',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5
                    }}>
                      <Typography variant="caption">{gate.status}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Gate Number: {gate.gate_number}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Type: {gate.type}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Location: {gate.location || 'N/A'}
                  </Typography>
                  {gate.description && (
                    <Typography variant="body2" color="textSecondary">
                      Description: {gate.description}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <IconButton 
                      color={gate.status === 'ACTIVE' ? 'error' : 'success'}
                      onClick={() => handleToggleStatus(gate)}
                      title={gate.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      <PowerIcon />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog(gate)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => deleteGateMutation.mutate(gate.id)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editGate ? 'Edit Gate' : 'Add New Gate'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Gate Number"
                  name="gate_number"
                  value={formData.gate_number}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    label="Type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="ENTRY">ENTRY</MenuItem>
                    <MenuItem value="EXIT">EXIT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              {editGate && (
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status || 'INACTIVE'}
                      label="Status"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                      <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">CANCEL</Button>
          <Button 
            onClick={handleSaveGate} 
            color="primary" 
            variant="contained"
            disabled={createGateMutation.isPending || updateGateMutation.isPending}
          >
            {createGateMutation.isPending || updateGateMutation.isPending ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                {editGate ? 'SAVING...' : 'CREATING...'}
              </>
            ) : (
              editGate ? 'SAVE' : 'CREATE'
            )}
          </Button>
        </DialogActions>
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
  );
};

export default GatesPage; 