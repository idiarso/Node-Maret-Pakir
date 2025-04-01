import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface Device {
  id: string;
  name: string;
  type: 'camera' | 'printer' | 'scanner' | 'gate' | 'arduino';
  port: string;
  status: 'active' | 'inactive' | 'error';
  lastError?: string;
  lastSeen?: string;
  isFallback: boolean;
  settings: {
    baudRate: number;
    dataBits: number;
    stopBits: number;
    parity: string;
  };
}

const DeviceManagement: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<Partial<Device>>({
    name: '',
    type: 'camera',
    port: '',
    isFallback: false,
    settings: {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
    },
  });

  const { data: devices = [], isLoading, error } = useQuery<Device[], Error>({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await axios.get<Device[]>('http://localhost:3000/api/settings/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateDeviceMutation = useMutation<Device, Error, Device>({
    mutationFn: async (device: Device) => {
      const response = await axios.put<Device>(
        `http://localhost:3000/api/settings/devices/${device.id}`,
        device,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      handleCloseDialog();
    },
  });

  const handleOpenDialog = (device?: Device) => {
    if (device) {
      setSelectedDevice(device);
      setFormData(device);
    } else {
      setSelectedDevice(null);
      setFormData({
        name: '',
        type: 'camera',
        port: '',
        isFallback: false,
        settings: {
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
        },
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDevice(null);
    setFormData({
      name: '',
      type: 'camera',
      port: '',
      isFallback: false,
      settings: {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      },
    });
  };

  const handleSubmit = () => {
    if (selectedDevice) {
      updateDeviceMutation.mutate({ ...selectedDevice, ...formData } as Device);
    }
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDeviceTypeIcon = (type: Device['type']) => {
    switch (type) {
      case 'printer':
        return '🖨️';
      case 'scanner':
        return '📷';
      case 'gate':
        return '🚪';
      case 'arduino':
        return '⚡';
      default:
        return '��';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading devices: {error.message}
          </Alert>
          <Button
            variant="contained"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['devices'] })}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Device Management
          </Typography>
          <Box>
            <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['devices'] })}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Device
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Seen</TableCell>
                <TableCell>Last Error</TableCell>
                <TableCell>Fallback</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No devices found
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device: Device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getDeviceTypeIcon(device.type)}</span>
                        {device.name}
                      </Box>
                    </TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell>{device.port}</TableCell>
                    <TableCell>
                      <Chip
                        label={device.status}
                        color={getStatusColor(device.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {device.lastError ? (
                        <Alert severity="error" sx={{ py: 0 }}>
                          {device.lastError}
                        </Alert>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.isFallback ? 'Yes' : 'No'}
                        color={device.isFallback ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(device)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedDevice ? 'Edit Device' : 'Add New Device'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Device Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Device Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Device Type"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Device['type'] })}
                  >
                    <MenuItem value="printer">Printer</MenuItem>
                    <MenuItem value="scanner">Scanner</MenuItem>
                    <MenuItem value="gate">Gate</MenuItem>
                    <MenuItem value="arduino">Arduino</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Port"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFallback}
                      onChange={(e) => setFormData({ ...formData, isFallback: e.target.checked })}
                    />
                  }
                  label="Use as Fallback Device"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Serial Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Baud Rate"
                      value={formData.settings?.baudRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            baudRate: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Data Bits"
                      value={formData.settings?.dataBits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            dataBits: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Stop Bits"
                      value={formData.settings?.stopBits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            stopBits: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Parity"
                      value={formData.settings?.parity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            parity: e.target.value,
                          },
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={updateDeviceMutation.isPending}
            >
              {selectedDevice ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DeviceManagement; 