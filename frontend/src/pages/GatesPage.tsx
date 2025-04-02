import React, { useState, useEffect } from 'react';
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
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LockOpen as OpenIcon,
  Lock as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { gateService } from '../services/api';
import { Gate } from '../types';

// Gate status constants
const GATE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  ERROR: 'ERROR',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
};

const GatesPage: React.FC = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editGate, setEditGate] = useState<Gate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    deviceId: 0,
    status: GATE_STATUS.CLOSED
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

  const fetchGates = async () => {
    setLoading(true);
    try {
      const data = await gateService.getAll();
      setGates(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching gates:', err);
      setError('Failed to load gates. Please try again later.');
      // For development purposes, set dummy data when API fails
      setGates([
        {
          id: 1,
          name: 'Main Entrance Gate',
          location: 'North Side',
          deviceId: 1,
          status: GATE_STATUS.CLOSED,
          lastStatusChange: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Exit Gate',
          location: 'South Side',
          deviceId: 2,
          status: GATE_STATUS.OPEN,
          lastStatusChange: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'VIP Entrance',
          location: 'East Wing',
          deviceId: 3,
          status: GATE_STATUS.ERROR,
          lastStatusChange: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGates();
  }, []);

  const handleOpenDialog = (gate: Gate | null = null) => {
    if (gate) {
      setEditGate(gate);
      setFormData({
        name: gate.name,
        location: gate.location || '',
        deviceId: gate.deviceId || 0,
        status: gate.status
      });
    } else {
      setEditGate(null);
      setFormData({
        name: '',
        location: '',
        deviceId: 0,
        status: GATE_STATUS.CLOSED
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value
    }));
  };

  const handleSaveGate = async () => {
    try {
      if (editGate) {
        // Update existing gate
        const updatedGate = await gateService.update(editGate.id, formData);
        
        // Handle optimistic UI updates
        if (updatedGate._optimistic) {
          setGates(prevGates => 
            prevGates.map(gate => 
              gate.id === editGate.id ? updatedGate : gate
            )
          );
          
          setSnackbar({
            open: true,
            message: `Gate "${updatedGate.name}" updated locally. Server error occurred.`,
            severity: 'warning'
          });
        } else {
          // Normal update with server success
          setGates(prevGates => 
            prevGates.map(gate => 
              gate.id === editGate.id ? updatedGate : gate
            )
          );
          
          setSnackbar({
            open: true,
            message: `Gate "${updatedGate.name}" updated successfully`,
            severity: 'success'
          });
        }
      } else {
        // Create new gate
        const newGate = await gateService.create(formData);
        
        // Handle optimistic UI updates
        if (newGate._optimistic) {
          setGates(prevGates => [...prevGates, newGate]);
          
          setSnackbar({
            open: true,
            message: `Gate "${newGate.name}" created locally. Server error occurred.`,
            severity: 'warning'
          });
        } else {
          // Normal creation with server success
          setGates(prevGates => [...prevGates, newGate]);
          
          setSnackbar({
            open: true,
            message: `Gate "${newGate.name}" created successfully`,
            severity: 'success'
          });
        }
      }
      
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving gate:', err);
      
      setSnackbar({
        open: true,
        message: 'Error saving gate. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDeleteGate = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this gate?')) {
      try {
        await gateService.delete(id);
        
        // Always update UI regardless of server response
        setGates(gates.filter(gate => gate.id !== id));
        
        setSnackbar({
          open: true,
          message: 'Gate deleted successfully',
          severity: 'success'
        });
      } catch (err) {
        console.error('Error deleting gate:', err);
        
        // Still remove from UI even on error for better UX
        setGates(gates.filter(gate => gate.id !== id));
        
        setSnackbar({
          open: true,
          message: 'Gate deleted from view. Server error occurred.',
          severity: 'warning'
        });
      }
    }
  };

  const handleChangeGateStatus = async (id: number, status: string) => {
    try {
      const updatedGate = await gateService.changeStatus(id, status);
      
      // Handle optimistic UI updates
      if (updatedGate._optimistic) {
        setGates(prevGates => 
          prevGates.map(gate => 
            gate.id === id ? updatedGate : gate
          )
        );
        
        setSnackbar({
          open: true,
          message: `Gate status changed locally. Server error occurred.`,
          severity: 'warning'
        });
      } else {
        // Normal update with server success
        setGates(prevGates => 
          prevGates.map(gate => 
            gate.id === id ? updatedGate : gate
          )
        );
        
        setSnackbar({
          open: true,
          message: `Gate status changed successfully`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error changing gate status:', err);
      
      setSnackbar({
        open: true,
        message: 'Error changing gate status. Please try again.',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case GATE_STATUS.ACTIVE:
        return 'success';
      case GATE_STATUS.OPEN:
        return 'success';
      case GATE_STATUS.CLOSED:
        return 'warning';
      case GATE_STATUS.INACTIVE:
        return 'default';
      case GATE_STATUS.MAINTENANCE:
        return 'info';
      case GATE_STATUS.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isOptimistic = (gate: Gate) => {
    return gate._optimistic === true;
  };

  const renderGateName = (gate: Gate) => {
    if (isOptimistic(gate)) {
      return (
        <Tooltip title={gate._error || 'This data is only stored locally'}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {gate.name}
            <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
          </Box>
        </Tooltip>
      );
    }
    return gate.name;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gates Management
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchGates}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Gate
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        Monitor and control parking gates in the system.
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {gates.map((gate) => (
          <Grid item xs={12} md={4} key={gate.id}>
            <Card sx={isOptimistic(gate) ? { border: '1px dashed orange' } : {}}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {renderGateName(gate)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Location: {gate.location || 'N/A'}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Status:
                  </Typography>
                  <Chip 
                    label={gate.status} 
                    color={getStatusColor(gate.status) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Last Status Change: {gate.lastStatusChange ? new Date(gate.lastStatusChange).toLocaleString() : 'N/A'}
                </Typography>
                {isOptimistic(gate) && (
                  <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                    {gate._error || 'This data is only stored locally'}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                {gate.status !== GATE_STATUS.OPEN && (
                  <Button 
                    size="small" 
                    startIcon={<OpenIcon />}
                    onClick={() => handleChangeGateStatus(gate.id, GATE_STATUS.OPEN)}
                  >
                    Open
                  </Button>
                )}
                {gate.status !== GATE_STATUS.CLOSED && (
                  <Button 
                    size="small" 
                    startIcon={<CloseIcon />}
                    onClick={() => handleChangeGateStatus(gate.id, GATE_STATUS.CLOSED)}
                  >
                    Close
                  </Button>
                )}
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(gate)}
                >
                  Edit
                </Button>
                <Button 
                  size="small" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteGate(gate.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Gates List
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Device ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Status Change</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gates.map((gate) => (
              <TableRow key={gate.id} sx={isOptimistic(gate) ? { backgroundColor: 'rgba(255, 152, 0, 0.1)' } : {}}>
                <TableCell>{gate.id}</TableCell>
                <TableCell>{renderGateName(gate)}</TableCell>
                <TableCell>{gate.location}</TableCell>
                <TableCell>{gate.deviceId || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={gate.status} 
                    color={getStatusColor(gate.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {gate.lastStatusChange ? new Date(gate.lastStatusChange).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(gate)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteGate(gate.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {gates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No gates found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Gate Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editGate ? 'Edit Gate' : 'Add New Gate'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Gate Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.location}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="deviceId"
            label="Device ID"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.deviceId}
            onChange={handleInputChange}
          />
          <TextField
            select
            margin="dense"
            name="status"
            label="Status"
            fullWidth
            variant="outlined"
            value={formData.status}
            onChange={handleStatusChange}
          >
            <MenuItem value={GATE_STATUS.OPEN}>Open</MenuItem>
            <MenuItem value={GATE_STATUS.CLOSED}>Closed</MenuItem>
            <MenuItem value={GATE_STATUS.ERROR}>Error</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveGate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GatesPage; 