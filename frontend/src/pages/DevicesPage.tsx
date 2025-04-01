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
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { deviceService } from '../services/api';
import { Device } from '../types';
import { DEVICE_TYPES, DEVICE_STATUS } from '../utils/constants';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: DEVICE_TYPES[0],
    location: '',
    port: '',
    ipAddress: '',
    status: DEVICE_STATUS[0]
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await deviceService.getAll();
      setDevices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to load devices. Please try again later.');
      // For development purposes, set dummy data when API fails
      setDevices([
        {
          id: 1,
          name: 'Entry Scanner',
          type: 'CAMERA',
          location: 'Main Entrance',
          port: 'COM1',
          ipAddress: '192.168.1.100',
          status: 'ONLINE',
          lastPing: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Exit Printer',
          type: 'PAYMENT_TERMINAL',
          location: 'Exit Gate',
          port: 'COM2',
          ipAddress: '192.168.1.101',
          status: 'ONLINE',
          lastPing: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'Basement Loop Detector',
          type: 'SENSOR',
          location: 'Basement Entry',
          port: '',
          ipAddress: '192.168.1.102',
          status: 'ERROR',
          lastPing: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleOpenDialog = (device: Device | null = null) => {
    if (device) {
      setEditDevice(device);
      setFormData({
        name: device.name,
        type: device.type,
        location: device.location || '',
        port: device.port || '',
        ipAddress: device.ipAddress || '',
        status: device.status
      });
    } else {
      setEditDevice(null);
      setFormData({
        name: '',
        type: DEVICE_TYPES[0],
        location: '',
        port: '',
        ipAddress: '',
        status: DEVICE_STATUS[0]
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

  const handleSaveDevice = async () => {
    try {
      if (editDevice) {
        // Update existing device
        await deviceService.update(editDevice.id, formData);
      } else {
        // Create new device
        await deviceService.create(formData);
      }
      handleCloseDialog();
      fetchDevices();
    } catch (err) {
      console.error('Error saving device:', err);
      // In a real app, you'd want to show an error message to the user
    }
  };

  const handleDeleteDevice = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deviceService.delete(id);
        fetchDevices();
      } catch (err) {
        console.error('Error deleting device:', err);
        // In a real app, you'd want to show an error message to the user
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'success';
      case 'OFFLINE':
      case 'MAINTENANCE':
        return 'warning';
      case 'ERROR':
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
          Devices
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchDevices}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Device
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage hardware devices in the parking system.
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Connection</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Ping</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(devices) && devices.length > 0 ? (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>{device.id}</TableCell>
                    <TableCell>{device.name}</TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell>{device.location}</TableCell>
                    <TableCell>
                      {device.ipAddress ? `IP: ${device.ipAddress}` : ''}
                      {device.port ? `Port: ${device.port}` : ''}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={device.status} 
                        color={getStatusColor(device.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {device.lastPing ? new Date(device.lastPing).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog(device)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteDevice(device.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No devices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Device Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details for the device.
          </DialogContentText>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Device Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="type"
                label="Device Type"
                select
                fullWidth
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                {DEVICE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="location"
                label="Location"
                fullWidth
                value={formData.location}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="ipAddress"
                label="IP Address"
                fullWidth
                value={formData.ipAddress}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="port"
                label="Port"
                fullWidth
                value={formData.port}
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
                {DEVICE_STATUS.map((status) => (
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
          <Button onClick={handleSaveDevice} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DevicesPage; 