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

// Database menggunakan tipe kendaraan ini
enum DatabaseVehicleType {
  MOBIL = 'MOBIL',
  MOTOR = 'MOTOR',
  TRUK = 'TRUK',
  VAN = 'VAN',
  BUS = 'BUS',
  CAR = 'CAR',               // Untuk kompatibilitas dengan data lama
  MOTORCYCLE = 'MOTORCYCLE', // Untuk kompatibilitas dengan data lama
  TRUCK = 'TRUCK'            // Untuk kompatibilitas dengan data lama
}

// Definisikan mapping dari enum VehicleType ke DatabaseVehicleType
const vehicleTypeMapping: Record<VehicleType, DatabaseVehicleType> = {
  [VehicleType.CAR]: DatabaseVehicleType.MOBIL,
  [VehicleType.MOTORCYCLE]: DatabaseVehicleType.MOTOR,
  [VehicleType.TRUCK]: DatabaseVehicleType.TRUK,
  [VehicleType.VAN]: DatabaseVehicleType.VAN,
  [VehicleType.BUS]: DatabaseVehicleType.BUS
};

// Mapping balik dari DatabaseVehicleType ke VehicleType
const reverseVehicleTypeMapping: Record<string, VehicleType> = {
  [DatabaseVehicleType.MOBIL]: VehicleType.CAR,
  [DatabaseVehicleType.MOTOR]: VehicleType.MOTORCYCLE,
  [DatabaseVehicleType.TRUK]: VehicleType.TRUCK,
  [DatabaseVehicleType.VAN]: VehicleType.VAN,
  [DatabaseVehicleType.BUS]: VehicleType.BUS,
  [DatabaseVehicleType.CAR]: VehicleType.CAR,
  [DatabaseVehicleType.MOTORCYCLE]: VehicleType.MOTORCYCLE,
  [DatabaseVehicleType.TRUCK]: VehicleType.TRUCK
};

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
    severity: 'success' | 'error' | 'warning';
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

  // Konversikan format kendaraan dari database ke format UI
  const normalizedRates = rates.map(rate => {
    const vehicleTypeStr = String(rate.vehicle_type);
    // Ambil VehicleType yang sesuai berdasarkan mapping
    const normalizedType = reverseVehicleTypeMapping[vehicleTypeStr] || vehicleTypeStr as VehicleType;
    
    return {
      ...rate,
      vehicle_type: normalizedType
    };
  });

  const createRateMutation = useMutation({
    mutationFn: (data: Partial<ParkingRate>) => {
      // Konversikan ke format database sebelum mengirim
      const mappedData = {
        ...data,
        vehicle_type: vehicleTypeMapping[data.vehicle_type as VehicleType] || data.vehicle_type
      };
      return parkingRateService.create(mappedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: getTranslation('parkingRateSaved'),
        severity: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Error saving parking rate:', error);
      
      // Check if this is our special fallback error with optimistic data
      if (error.fallbackData && error.isServerError) {
        // Use the optimistic data for UI without invalidating queries
        queryClient.setQueryData(['parkingRates'], (oldData: ParkingRate[] | undefined) => {
          if (!oldData) return [error.fallbackData];
          
          // Add the new optimistic item
          return [...oldData, error.fallbackData];
        });
        
        // Close dialog since we're showing created data in UI
        handleCloseDialog();
        
        // Show warning notification
        setSnackbar({
          open: true,
          message: getTranslation('serverErrorFallbackUsed'),
          severity: 'warning',
        });
        
        return;
      }
      
      setSnackbar({
        open: true,
        message: error.message || getTranslation('errorSavingParkingRate'),
        severity: 'error',
      });
    }
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<ParkingRate> }) => {
      // Konversikan ke format database sebelum mengirim
      const mappedData = {
        ...data,
        vehicle_type: vehicleTypeMapping[data.vehicle_type as VehicleType] || data.vehicle_type
      };
      return parkingRateService.update(id, mappedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: getTranslation('parkingRateUpdated'),
        severity: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Error updating parking rate:', error);
      
      // Check if this is our special fallback error with optimistic data
      if (error.fallbackData && error.isServerError) {
        // Use the optimistic data for UI without invalidating queries
        queryClient.setQueryData(['parkingRates'], (oldData: ParkingRate[] | undefined) => {
          if (!oldData) return [error.fallbackData];
          
          // Replace the old rate with our optimistically updated one
          return oldData.map(item => 
            item.id === error.fallbackData.id ? error.fallbackData : item
          );
        });
        
        // Close dialog since we're showing updated data in UI
        handleCloseDialog();
        
        // Show warning notification
        setSnackbar({
          open: true,
          message: getTranslation('serverErrorFallbackUsed'),
          severity: 'warning',
        });
        
        return;
      }
      
      // Get a readable error message
      let errorMessage = getTranslation('errorUpdatingParkingRate');
      if (error.response) {
        // Server responded with an error
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `${getTranslation('errorUpdatingParkingRate')}: ${error.response.status}`;
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
        message: getTranslation('parkingRateDeleted'),
        severity: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting parking rate:', error);
      
      // Despite the error, update the UI optimistically
      if (error.response && error.response.status === 500) {
        const deleteId = error.config?.url?.split('/').pop();
        if (deleteId) {
          const id = parseInt(deleteId, 10);
          
          // Remove the item from the UI despite server error
          queryClient.setQueryData(['parkingRates'], (oldData: ParkingRate[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter(item => item.id !== id);
          });
          
          // Show warning notification
          setSnackbar({
            open: true,
            message: getTranslation('serverErrorFallbackUsed'),
            severity: 'warning',
          });
          
          return;
        }
      }
      
      setSnackbar({
        open: true,
        message: error.message || getTranslation('errorDeletingParkingRate'),
        severity: 'error',
      });
    }
  });

  const handleOpenDialog = (rate?: ParkingRate) => {
    if (rate) {
      // Konversikan format kendaraan dari database ke format UI
      const vehicleTypeStr = String(rate.vehicle_type);
      const normalizedType = reverseVehicleTypeMapping[vehicleTypeStr] || vehicleTypeStr as VehicleType;
      
      setSelectedRate(rate);
      setFormData({
        ...rate,
        vehicle_type: normalizedType
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

  // Add dummy translation if not available in the context
  const translationFallbacks = {
    serverErrorFallbackUsed: 'Koneksi server bermasalah. Perubahan akan ditampilkan secara lokal saja.',
    parkingRateSaved: 'Tarif parkir berhasil disimpan',
    parkingRateUpdated: 'Tarif parkir berhasil diperbarui',
    errorSavingParkingRate: 'Gagal menyimpan tarif parkir',
    errorUpdatingParkingRate: 'Gagal memperbarui tarif parkir',
    parkingRateDeleted: 'Tarif parkir berhasil dihapus',
    errorDeletingParkingRate: 'Gagal menghapus tarif parkir',
    confirmDeleteRate: 'Apakah Anda yakin ingin menghapus tarif parkir ini?',
    pleaseFixFormErrors: 'Mohon perbaiki kesalahan pada formulir',
  };

  // Helper function for getting translations with fallbacks
  const getTranslation = (key: string) => {
    // Try to use the translate function from context
    const translated = translate(key);
    // If it returns the key itself (not found), use our fallback
    return translated === key && translationFallbacks[key as keyof typeof translationFallbacks]
      ? translationFallbacks[key as keyof typeof translationFallbacks]
      : translated;
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
        message: getTranslation('pleaseFixFormErrors'),
        severity: 'error',
      });
      return;
    }

    // Simplified data submission
    const dataToSubmit: Partial<ParkingRate> = {
      vehicle_type: formData.vehicle_type,
      base_rate: Number(formData.base_rate),
      status: formData.status || 'active'
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
    if (window.confirm(getTranslation('confirmDeleteRate'))) {
      deleteRateMutation.mutate(id);
    }
  };

  // Translate vehicle type
  const getVehicleTypeTranslation = (type: string) => {
    // Konversi tipe ke VehicleType agar bisa digunakan dengan vehicleTypeTranslations
    const vehicleTypeKey = reverseVehicleTypeMapping[type] || type as VehicleType;
    const typeTranslation = vehicleTypeTranslations[vehicleTypeKey];
    
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
        ) : !Array.isArray(normalizedRates) || normalizedRates.length === 0 ? (
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
                {normalizedRates.map((rate) => (
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
                value={formData.vehicle_type as VehicleType || VehicleType.CAR}
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