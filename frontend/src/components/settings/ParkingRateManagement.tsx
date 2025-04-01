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
  Grid,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface ParkingRate {
  id: string;
  vehicleType: string;
  baseRate: number;
  hourlyRate: number;
  maxDailyRate: number;
  isActive: boolean;
  specialRates?: {
    startTime: string;
    endTime: string;
    rate: number;
  }[];
}

const ParkingRateManagement: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ParkingRate | null>(null);
  const [formData, setFormData] = useState<Partial<ParkingRate>>({
    vehicleType: '',
    baseRate: 0,
    hourlyRate: 0,
    maxDailyRate: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ParkingRate, string>>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: rates = [], isLoading } = useQuery<ParkingRate[], Error>({
    queryKey: ['parkingRates'],
    queryFn: async () => {
      const response = await axios.get<ParkingRate[]>('http://localhost:3000/api/settings/parking-rates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const updateRateMutation = useMutation<ParkingRate, Error, ParkingRate>({
    mutationFn: async (rate: ParkingRate) => {
      const response = await axios.put<ParkingRate>(
        `http://localhost:3000/api/settings/parking-rates/${rate.id}`,
        rate,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
      handleCloseDialog();
    },
  });

  const handleOpenDialog = (rate?: ParkingRate) => {
    if (rate) {
      setSelectedRate(rate);
      setFormData(rate);
    } else {
      setSelectedRate(null);
      setFormData({
        vehicleType: '',
        baseRate: 0,
        hourlyRate: 0,
        maxDailyRate: 0,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRate(null);
    setFormData({
      vehicleType: '',
      baseRate: 0,
      hourlyRate: 0,
      maxDailyRate: 0,
      isActive: true,
    });
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ParkingRate, string>> = {};
    
    if (!formData.vehicleType) {
      errors.vehicleType = 'Vehicle type is required';
    }
    if (formData.baseRate < 0) {
      errors.baseRate = 'Base rate cannot be negative';
    }
    if (formData.hourlyRate < 0) {
      errors.hourlyRate = 'Hourly rate cannot be negative';
    }
    if (formData.maxDailyRate < 0) {
      errors.maxDailyRate = 'Max daily rate cannot be negative';
    }
    if (formData.maxDailyRate < formData.baseRate) {
      errors.maxDailyRate = 'Max daily rate must be greater than base rate';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (selectedRate) {
      updateRateMutation.mutate({ ...selectedRate, ...formData } as ParkingRate);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading parking rates: {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['parkingRates'] })}
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
            Parking Rate Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
            startIcon={<EditIcon />}
          >
            Add Rate
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle Type</TableCell>
                <TableCell>Base Rate</TableCell>
                <TableCell>Hourly Rate</TableCell>
                <TableCell>Max Daily Rate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Special Rates</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading rates...
                  </TableCell>
                </TableRow>
              ) : rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No rates found
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate: ParkingRate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{rate.vehicleType}</TableCell>
                    <TableCell>${rate.baseRate.toFixed(2)}</TableCell>
                    <TableCell>${rate.hourlyRate.toFixed(2)}</TableCell>
                    <TableCell>${rate.maxDailyRate.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={rate.isActive ? 'Active' : 'Inactive'}
                        color={rate.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {rate.specialRates?.length || 0} special rates
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(rate)}>
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

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedRate ? 'Edit Rate' : 'Add Rate'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Vehicle Type"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  error={!!formErrors.vehicleType}
                  helperText={formErrors.vehicleType}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base Rate"
                  value={formData.baseRate}
                  onChange={(e) => setFormData({ ...formData, baseRate: Number(e.target.value) })}
                  error={!!formErrors.baseRate}
                  helperText={formErrors.baseRate}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Hourly Rate"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  error={!!formErrors.hourlyRate}
                  helperText={formErrors.hourlyRate}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Daily Rate"
                  value={formData.maxDailyRate}
                  onChange={(e) => setFormData({ ...formData, maxDailyRate: Number(e.target.value) })}
                  error={!!formErrors.maxDailyRate}
                  helperText={formErrors.maxDailyRate}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={updateRateMutation.isPending}
            >
              {updateRateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ParkingRateManagement; 