import { useState, FC } from 'react';
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
  Chip,
  Button,
  CircularProgress,
  IconButton,
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
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { parkingRateService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParkingRate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import PageWrapper from '../components/PageWrapper';
import { VehicleType } from '../utils/constants';

const vehicleTypeTranslations = {
  [VehicleType.CAR]: {
    'en': 'Car',
    'id': 'Mobil'
  },
  [VehicleType.MOTORCYCLE]: {
    'en': 'Motorcycle',
    'id': 'Motor'
  },
  [VehicleType.TRUCK]: {
    'en': 'Truck',
    'id': 'Truk'
  },
  [VehicleType.VAN]: {
    'en': 'Van',
    'id': 'Van'
  },
  [VehicleType.BUS]: {
    'en': 'Bus',
    'id': 'Bus'
  }
};

const vehicleTypes = Object.values(VehicleType);

const ParkingRatesPageContent: FC = () => {
  const { translate, currentLanguage } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ParkingRate | null>(null);
  const [formData, setFormData] = useState<Partial<ParkingRate>>({
    vehicle_type: VehicleType.CAR,
    base_rate: 0,
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<{
    vehicle_type?: string;
    base_rate?: string;
  }>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const queryClient = useQueryClient();
  
  const { 
    data: rates = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['parkingRates'],
    queryFn: parkingRateService.getAll
  });

  const createRateMutation = useMutation({
    mutationFn: (data: Partial<ParkingRate>) => parkingRateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: translate('parkingRateSaved'),
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Error saving parking rate:', error);
      setSnackbar({
        open: true,
        message: translate('errorSavingParkingRate'),
        severity: 'error',
      });
    }
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ParkingRate> }) => 
      parkingRateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: translate('parkingRateUpdated'),
        severity: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Error updating parking rate:', error);
      
      // Get a readable error message
      let errorMessage = translate('errorUpdatingParkingRate');
      if (error.response) {
        // Server responded with an error
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `${translate('errorUpdatingParkingRate')}: ${error.response.status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id: number) => parkingRateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
      setSnackbar({
        open: true,
        message: translate('parkingRateDeleted'),
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Error deleting parking rate:', error);
      setSnackbar({
        open: true,
        message: translate('errorDeletingParkingRate'),
        severity: 'error',
      });
    }
  });

  const handleOpenDialog = (rate?: ParkingRate) => {
    if (rate) {
      setSelectedRate(rate);
      setFormData({
        ...rate
      });
    } else {
      setSelectedRate(null);
      setFormData({
        vehicle_type: VehicleType.CAR,
        base_rate: 0,
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRate(null);
  };

  // Handle Select change
  const handleSelectChange = (e: SelectChangeEvent<VehicleType>) => {
    const { name, value } = e.target;
    if (name === 'vehicle_type') {
      setFormData({
        ...formData,
        vehicle_type: value as VehicleType
      });
      // Clear vehicle type error if exists
      if (formErrors.vehicle_type) {
        setFormErrors({
          ...formErrors,
          vehicle_type: undefined
        });
      }
    }
  };

  // Handle input change for text fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'status') {
      setFormData({
        ...formData,
        status: checked ? 'active' : 'inactive'
      });
    } else if (type === 'number') {
      // Convert string values to numbers for numeric fields
      const numericValue = value === '' ? 0 : Number(value);
      if (!isNaN(numericValue)) {
        setFormData({
          ...formData,
          [name]: numericValue
        });
        
        // Clear error for this field if it exists
        if (formErrors[name as keyof typeof formErrors]) {
          setFormErrors({
            ...formErrors,
            [name]: undefined
          });
        }
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      vehicle_type?: string;
      base_rate?: string;
    } = {};
    
    // Check required fields
    if (!formData.vehicle_type) {
      errors.vehicle_type = translate('fieldRequired');
    }
    
    // Validate numeric fields
    if (!formData.base_rate || formData.base_rate <= 0) {
      errors.base_rate = translate('mustBePositiveNumber');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: translate('pleaseFixFormErrors'),
        severity: 'error',
      });
      return;
    }

    // Transform the data to match backend expectations
    const dataToSubmit: Partial<ParkingRate> = {
      vehicle_type: formData.vehicle_type,
      base_rate: Number(formData.base_rate),
      status: formData.status || 'active',
      // Add required fields
      effective_from: new Date(),
      hourly_rate: 0,
      daily_rate: Number(formData.base_rate) * 8, // Default daily rate (8x base rate)
      is_weekend_rate: false,
      is_holiday_rate: false,
      grace_period: 15
    };

    console.log('Submitting data:', dataToSubmit);

    if (selectedRate) {
      updateRateMutation.mutate({ 
        id: selectedRate.id, 
        data: dataToSubmit 
      });
    } else {
      createRateMutation.mutate(dataToSubmit);
    }
  };

  const handleDeleteRate = (id: number) => {
    if (window.confirm(translate('confirmDeleteRate'))) {
      deleteRateMutation.mutate(id);
    }
  };

  // Translate vehicle type
  const getVehicleTypeTranslation = (type: string) => {
    const typeTranslation = vehicleTypeTranslations[type as keyof typeof vehicleTypeTranslations];
    if (!typeTranslation) return type;
    
    return typeTranslation[currentLanguage as keyof typeof typeTranslation] || 
           typeTranslation['en'] || 
           type;
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          {translate('parkingRates')}
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            disabled={isLoading}
            sx={{ mr: 1 }}
          >
            {translate('refresh')}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            {translate('addRate')}
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        {translate('configureRatesDescription')}
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff4f4' }}>
          <Typography color="error">{translate('errorLoadingRates')}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !Array.isArray(rates) || rates.length === 0 ? (
          <Typography>{translate('noRatesFound')}</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{translate('vehicleType')}</TableCell>
                  <TableCell>{translate('rate')}</TableCell>
                  <TableCell>{translate('status')}</TableCell>
                  <TableCell>{translate('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={`parking-rate-${rate.id}`}>
                    <TableCell>{getVehicleTypeTranslation(rate.vehicle_type)}</TableCell>
                    <TableCell>Rp {rate.base_rate ? rate.base_rate.toLocaleString() : '0'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rate.status === 'active' ? translate('active') : translate('inactive')} 
                        color={rate.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenDialog(rate)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteRate(rate.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRate ? translate('editParkingRate') : translate('addNewParkingRate')}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal" error={!!formErrors.vehicle_type}>
              <InputLabel id="vehicle-type-label">{translate('vehicleType')}</InputLabel>
              <Select
                labelId="vehicle-type-label"
                name="vehicle_type"
                value={formData.vehicle_type || VehicleType.CAR}
                label={translate('vehicleType')}
                onChange={handleSelectChange}
              >
                {Object.values(VehicleType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {getVehicleTypeTranslation(type)}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.vehicle_type && (
                <Typography variant="caption" color="error">
                  {formErrors.vehicle_type}
                </Typography>
              )}
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              label={translate('rate') + ' (Rp)'}
              name="base_rate"
              type="number"
              inputProps={{ min: 0, step: "1000" }}
              value={formData.base_rate === 0 ? '0' : formData.base_rate || ''}
              onChange={handleInputChange}
              error={!!formErrors.base_rate}
              helperText={formErrors.base_rate}
            />

            <FormControlLabel 
              control={
                <Switch 
                  checked={formData.status === 'active'}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      status: e.target.checked ? 'active' : 'inactive'
                    });
                  }}
                  name="status"
                  color="primary"
                />
              }
              label={translate('active')}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {translate('cancel')}
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedRate ? translate('update') : translate('create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Wrap the component with PageWrapper for error boundary
const ParkingRatesPage: FC = () => {
  return (
    <PageWrapper title="Parking Rates">
      <ParkingRatesPageContent />
    </PageWrapper>
  );
};

export default ParkingRatesPage; 