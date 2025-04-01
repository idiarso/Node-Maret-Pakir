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
  OpenInNew as OpenIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface Gate {
  id: string;
  name: string;
  type: 'entry' | 'exit';
  deviceId: string;
  status: 'active' | 'inactive' | 'error';
  isOpen: boolean;
  lastOpened: string | null;
  lastClosed: string | null;
  lastError?: string;
  loopDetector: {
    isActive: boolean;
    lastTriggered: string | null;
  };
  settings: {
    autoCloseDelay: number;
    loopDetectorEnabled: boolean;
    loopDetectorDelay: number;
  };
}

const GateManagement: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'entry' as Gate['type'],
    deviceId: '',
    settings: {
      autoCloseDelay: 30,
      loopDetectorEnabled: true,
      loopDetectorDelay: 5,
    },
  });

  const { data: gates, isLoading } = useQuery<Gate[]>({
    queryKey: ['gates'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/settings/gates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const updateGateMutation = useMutation({
    mutationFn: async (gateData: Partial<Gate>) => {
      const response = await axios.put(
        `http://localhost:3000/api/settings/gates/${selectedGate?.id}`,
        gateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
      handleCloseDialog();
    },
  });

  const controlGateMutation = useMutation({
    mutationFn: async ({ gateId, action }: { gateId: string; action: 'open' | 'close' }) => {
      const response = await axios.post(
        `http://localhost:3000/api/settings/gates/${gateId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gates'] });
    },
  });

  const handleOpenDialog = (gate?: Gate) => {
    if (gate) {
      setSelectedGate(gate);
      setFormData({
        name: gate.name,
        type: gate.type,
        deviceId: gate.deviceId,
        settings: gate.settings,
      });
    } else {
      setSelectedGate(null);
      setFormData({
        name: '',
        type: 'entry',
        deviceId: '',
        settings: {
          autoCloseDelay: 30,
          loopDetectorEnabled: true,
          loopDetectorDelay: 5,
        },
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedGate(null);
    setFormData({
      name: '',
      type: 'entry',
      deviceId: '',
      settings: {
        autoCloseDelay: 30,
        loopDetectorEnabled: true,
        loopDetectorDelay: 5,
      },
    });
  };

  const handleSubmit = () => {
    updateGateMutation.mutate(formData);
  };

  const handleControlGate = (gateId: string, action: 'open' | 'close') => {
    controlGateMutation.mutate({ gateId, action });
  };

  const getStatusColor = (status: Gate['status']) => {
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

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Gate Management
          </Typography>
          <Box>
            <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['gates'] })}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Gate
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Gate Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Gate State</TableCell>
                <TableCell>Last Opened</TableCell>
                <TableCell>Last Closed</TableCell>
                <TableCell>Loop Detector</TableCell>
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
              ) : gates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No gates found
                  </TableCell>
                </TableRow>
              ) : (
                gates?.map((gate) => (
                  <TableRow key={gate.id}>
                    <TableCell>{gate.name}</TableCell>
                    <TableCell>{gate.type}</TableCell>
                    <TableCell>
                      <Chip
                        label={gate.status}
                        color={getStatusColor(gate.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gate.isOpen ? 'Open' : 'Closed'}
                        color={gate.isOpen ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {gate.lastOpened ? new Date(gate.lastOpened).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {gate.lastClosed ? new Date(gate.lastClosed).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          label={gate.loopDetector.isActive ? 'Active' : 'Inactive'}
                          color={gate.loopDetector.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        {gate.loopDetector.lastTriggered && (
                          <Typography variant="caption" color="text.secondary">
                            Last triggered: {new Date(gate.loopDetector.lastTriggered).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          onClick={() => handleControlGate(gate.id, 'open')}
                          disabled={gate.isOpen || gate.status !== 'active'}
                        >
                          <OpenIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleControlGate(gate.id, 'close')}
                          disabled={!gate.isOpen || gate.status !== 'active'}
                        >
                          <CloseIcon />
                        </IconButton>
                        <IconButton onClick={() => handleOpenDialog(gate)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedGate ? 'Edit Gate' : 'Add New Gate'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Gate Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Gate Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Gate Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Gate['type'] })}
                >
                  <MenuItem value="entry">Entry</MenuItem>
                  <MenuItem value="exit">Exit</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Device</InputLabel>
                <Select
                  value={formData.deviceId}
                  label="Device"
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                >
                  {/* Add device options here */}
                </Select>
              </FormControl>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Gate Settings
              </Typography>
              <TextField
                label="Auto Close Delay (seconds)"
                type="number"
                value={formData.settings.autoCloseDelay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, autoCloseDelay: Number(e.target.value) },
                  })
                }
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings.loopDetectorEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          loopDetectorEnabled: e.target.checked,
                        },
                      })
                    }
                  />
                }
                label="Enable Loop Detector"
              />
              <TextField
                label="Loop Detector Delay (seconds)"
                type="number"
                value={formData.settings.loopDetectorDelay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      loopDetectorDelay: Number(e.target.value),
                    },
                  })
                }
                fullWidth
                disabled={!formData.settings.loopDetectorEnabled}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={updateGateMutation.isPending}
            >
              {selectedGate ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default GateManagement; 