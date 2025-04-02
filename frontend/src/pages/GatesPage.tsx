import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PowerSettingsNew as PowerIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gateService } from '../services/api';
import { Gate } from '../types';
import logger from '../utils/logger';

interface GateFormData {
  name: string;
  gate_number: string;
  location: string;
  type: 'ENTRY' | 'EXIT';
  description: string;
}

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
        console.log('GatesPage: Fetching gates API endpoint:', '/api/gates');
        
        const response = await gateService.getAll();
        logger.debug('GatesPage: Received gates data', 'GatesPage');
        console.log('GatesPage: Gates response data:', response);
        
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
    }
  });
  
  // Ensure gates is always an array
  const gates: Gate[] = Array.isArray(data) ? data : [];

  // Create gate mutation
  const createGateMutation = useMutation<Gate, Error, GateFormData>({
    mutationFn: (data) => gateService.create(data),
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
      setSnackbar({
        open: true,
        message: 'Error creating gate. Please try again.',
        severity: 'error'
      });
    }
  });

  // Update gate mutation
  const updateGateMutation = useMutation<Gate, Error, { id: number; data: GateFormData }>({
    mutationFn: ({ id, data }) => gateService.update(id, data),
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
      setSnackbar({
        open: true,
        message: 'Error updating gate. Please try again.',
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
      setSnackbar({
        open: true,
        message: 'Error deleting gate. Please try again.',
        severity: 'error'
      });
    }
  });

  // Toggle gate status mutation
  const toggleStatusMutation = useMutation<Gate, Error, { id: number; status: string }>({
    mutationFn: ({ id, status }) => gateService.changeStatus(id, status),
    onSuccess: (updatedGate) => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      setSnackbar({
        open: true,
        message: `Gate status changed to ${updatedGate.status}`,
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      logger.error('Error changing gate status', error, 'GatesPage');
      setSnackbar({
        open: true,
        message: 'Error changing gate status. Please try again.',
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
        description: gate.description || ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveGate = () => {
    if (editGate) {
      updateGateMutation.mutate({
        id: editGate.id,
        data: formData
      });
    } else {
      createGateMutation.mutate(formData);
    }
  };

  const handleDeleteGate = (id: number) => {
    if (window.confirm('Are you sure you want to delete this gate?')) {
      deleteGateMutation.mutate(id);
    }
  };

  const handleToggleStatus = (gate: Gate) => {
    const newStatus = gate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatusMutation.mutate({ id: gate.id, status: newStatus });
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load gates. Please try again later.
        </Alert>
      )}

      <Grid container spacing={3}>
        {gates.length > 0 ? (
          gates.map((gate: Gate) => (
            <Grid item xs={12} sm={6} md={4} key={gate.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{gate.name}</Typography>
                    <Box>
                      <IconButton
                        color={gate.status === 'ACTIVE' ? 'success' : 'default'}
                        onClick={() => handleToggleStatus(gate)}
                      >
                        <PowerIcon />
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleOpenDialog(gate)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteGate(gate.id)}>
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
                    color={getStatusColor(gate.status)}
                    gutterBottom
                  >
                    Status: {gate.status}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              No gates found. Please add a new gate.
            </Alert>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editGate ? 'Edit Gate' : 'Add New Gate'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Gate Number"
              name="gate_number"
              value={formData.gate_number}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              margin="normal"
              required
            >
              <MenuItem value="ENTRY">Entry</MenuItem>
              <MenuItem value="EXIT">Exit</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveGate}
            variant="contained" 
            color="primary"
            disabled={!formData.name || !formData.gate_number}
          >
            {editGate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Add the default export
export default GatesPage; 