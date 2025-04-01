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
  CardActions
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LockOpen as OpenIcon,
  Lock as CloseIcon
} from '@mui/icons-material';
import { gateService } from '../services/api';
import { Gate } from '../types';

// Gate status constants
const GATE_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  ERROR: 'ERROR'
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
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveGate = async () => {
    try {
      if (editGate) {
        // Update existing gate
        await gateService.update(editGate.id, formData);
      } else {
        // Create new gate
        await gateService.create(formData);
      }
      handleCloseDialog();
      fetchGates();
    } catch (err) {
      console.error('Error saving gate:', err);
      // In a real app, you'd want to show an error message to the user
    }
  };

  const handleDeleteGate = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this gate?')) {
      try {
        await gateService.delete(id);
        fetchGates();
      } catch (err) {
        console.error('Error deleting gate:', err);
        // In a real app, you'd want to show an error message to the user
      }
    }
  };

  const handleChangeGateStatus = async (id: number, status: string) => {
    try {
      await gateService.changeStatus(id, status);
      fetchGates();
    } catch (err) {
      console.error('Error changing gate status:', err);
      // In a real app, you'd want to show an error message to the user
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case GATE_STATUS.OPEN:
        return 'success';
      case GATE_STATUS.CLOSED:
        return 'warning';
      case GATE_STATUS.ERROR:
        return 'error';
      default:
        return 'default';
    }
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
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {gate.name}
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
              <TableRow key={gate.id}>
                <TableCell>{gate.id}</TableCell>
                <TableCell>{gate.name}</TableCell>
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editGate ? 'Edit Gate' : 'Add New Gate'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details for the gate.
          </DialogContentText>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Gate Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="location"
                label="Location"
                fullWidth
                value={formData.location}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="deviceId"
                label="Device ID"
                type="number"
                fullWidth
                value={formData.deviceId || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="status"
                label="Status"
                select
                fullWidth
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                {Object.values(GATE_STATUS).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveGate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GatesPage; 