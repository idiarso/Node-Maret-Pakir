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
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { parkingRateService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParkingRate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const vehicleTypeTranslations = {
  'Car': {
    'en': 'Car',
    'id': 'Mobil'
  },
  'Motorcycle': {
    'en': 'Motorcycle',
    'id': 'Motor'
  },
  'Truck': {
    'en': 'Truck',
    'id': 'Truk'
  },
  'Bus': {
    'en': 'Bus',
    'id': 'Bus'
  },
  'Other': {
    'en': 'Other',
    'id': 'Lainnya'
  }
};

const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus', 'Other'];

const ParkingRatesPage: FC = () => {
  const { translate, currentLanguage } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ParkingRate | null>(null);
  const [formData, setFormData] = useState<Partial<ParkingRate>>({
    vehicleType: '',
    baseRate: 0,
    hourlyRate: 0,
    maxDailyRate: 0,
    isActive: true
  });
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
    onError: (error) => {
      console.error('Error updating parking rate:', error);
      setSnackbar({
        open: true,
        message: translate('errorUpdatingParkingRate'),
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
      setFormData(rate);
    } else {
      setSelectedRate(null);
      setFormData({
        vehicleType: '',
        baseRate: 0,
        hourlyRate: 0,
        maxDailyRate: 0,
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRate(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, checked } = e.target as HTMLInputElement;
    if (name === 'isActive') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name as string]: value
      });
    }
  };

  const handleSubmit = () => {
    if (selectedRate) {
      updateRateMutation.mutate({ id: selectedRate.id, data: formData });
    } else {
      createRateMutation.mutate(formData);
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

      <Paper sx={{ p: 3, mt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : rates.length === 0 ? (
          <Typography>{translate('noRatesFound')}</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{translate('vehicleType')}</TableCell>
                  <TableCell>{translate('baseRate')}</TableCell>
                  <TableCell>{translate('hourlyRate')}</TableCell>
                  <TableCell>{translate('maxDailyRate')}</TableCell>
                  <TableCell>{translate('status')}</TableCell>
                  <TableCell>{translate('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(rates) ? rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{getVehicleTypeTranslation(rate.vehicleType)}</TableCell>
                    <TableCell>Rp {rate.baseRate.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {rate.hourlyRate.toLocaleString('id-ID')}/{translate('hour')}</TableCell>
                    <TableCell>Rp {rate.maxDailyRate.toLocaleString('id-ID')}/{translate('day')}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rate.isActive ? translate('active') : translate('inactive')} 
                        color={rate.isActive ? 'success' : 'default'}
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
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {translate('errorLoadingRates')}
                    </TableCell>
                  </TableRow>
                )}
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
            <FormControl fullWidth margin="normal">
              <InputLabel id="vehicle-type-label">{translate('vehicleType')}</InputLabel>
              <Select
                labelId="vehicle-type-label"
                name="vehicleType"
                value={formData.vehicleType || ''}
                label={translate('vehicleType')}
                onChange={(event) => {
                  const name = "vehicleType";
                  const value = event.target.value;
                  setFormData({
                    ...formData,
                    [name]: value
                  });
                }}
              >
                {vehicleTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {getVehicleTypeTranslation(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              label={translate('baseRate') + ' (Rp)'}
              name="baseRate"
              type="number"
              value={formData.baseRate || ''}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              fullWidth
              label={translate('hourlyRate') + ' (Rp)'}
              name="hourlyRate"
              type="number"
              value={formData.hourlyRate || ''}
              onChange={handleInputChange}
            />

            <TextField
              margin="normal"
              fullWidth
              label={translate('maxDailyRate') + ' (Rp)'}
              name="maxDailyRate"
              type="number"
              value={formData.maxDailyRate || ''}
              onChange={handleInputChange}
            />

            <FormControlLabel 
              control={
                <Switch 
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  name="isActive"
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

export default ParkingRatesPage; 