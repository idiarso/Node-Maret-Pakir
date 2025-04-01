import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ParkingRate {
  id: number;
  vehicleType: string;
  baseRate: number;
  hourlyRate: number;
  isActive: boolean;
}

interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description: string;
}

const validationSchema = Yup.object({
  baseRate: Yup.number()
    .min(0, 'Tarif dasar harus lebih dari atau sama dengan 0')
    .required('Tarif dasar wajib diisi'),
  hourlyRate: Yup.number()
    .min(0, 'Tarif per jam harus lebih dari atau sama dengan 0')
    .required('Tarif per jam wajib diisi'),
});

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: parkingRates = [], isLoading: isLoadingRates } = useQuery<ParkingRate[]>({
    queryKey: ['parkingRates'],
    queryFn: async () => {
      const response = await fetch('/api/settings/parking-rates');
      if (!response.ok) {
        throw new Error('Gagal memuat data tarif parkir');
      }
      return response.json();
    },
  });

  const { data: systemConfigs = [], isLoading: isLoadingConfigs } = useQuery<SystemConfig[]>({
    queryKey: ['systemConfigs'],
    queryFn: async () => {
      const response = await fetch('/api/settings/system-configs');
      if (!response.ok) {
        throw new Error('Gagal memuat konfigurasi sistem');
      }
      return response.json();
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async (values: Partial<ParkingRate>) => {
      const response = await fetch(`/api/settings/parking-rates/${values.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error('Gagal memperbarui tarif parkir');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingRates'] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (config: SystemConfig) => {
      const response = await fetch(`/api/settings/system-configs/${config.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error('Gagal memperbarui konfigurasi sistem');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemConfigs'] });
    },
  });

  const handleToggleActive = (rate: ParkingRate) => {
    updateRateMutation.mutate({
      id: rate.id,
      isActive: !rate.isActive,
    });
  };

  const handleUpdateConfig = (config: SystemConfig, newValue: string) => {
    updateConfigMutation.mutate({
      ...config,
      value: newValue,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pengaturan Sistem
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 100%', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tarif Parkir
              </Typography>
              {isLoadingRates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                parkingRates.map((rate) => (
                  <Box key={rate.id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {rate.vehicleType === 'car' ? 'Mobil' :
                       rate.vehicleType === 'motorcycle' ? 'Motor' :
                       rate.vehicleType === 'truck' ? 'Truk' :
                       rate.vehicleType}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <TextField
                          fullWidth
                          label="Tarif Dasar"
                          type="number"
                          value={rate.baseRate}
                          onChange={(e) => {
                            updateRateMutation.mutate({
                              id: rate.id,
                              baseRate: Number(e.target.value),
                            });
                          }}
                          InputProps={{
                            startAdornment: <Typography>Rp</Typography>,
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: '1 1 200px' }}>
                        <TextField
                          fullWidth
                          label="Tarif per Jam"
                          type="number"
                          value={rate.hourlyRate}
                          onChange={(e) => {
                            updateRateMutation.mutate({
                              id: rate.id,
                              hourlyRate: Number(e.target.value),
                            });
                          }}
                          InputProps={{
                            startAdornment: <Typography>Rp</Typography>,
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: '0 0 auto' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rate.isActive}
                              onChange={() => handleToggleActive(rate)}
                            />
                          }
                          label="Aktif"
                        />
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 100%', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Konfigurasi Sistem
              </Typography>
              {isLoadingConfigs ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                systemConfigs.map((config) => (
                  <Box key={config.id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {config.description}
                    </Typography>
                    <TextField
                      fullWidth
                      value={config.value}
                      onChange={(e) => handleUpdateConfig(config, e.target.value)}
                      helperText={`Key: ${config.key}`}
                    />
                    <Divider sx={{ my: 2 }} />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {(updateRateMutation.isError || updateConfigMutation.isError) && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {updateRateMutation.error instanceof Error
            ? updateRateMutation.error.message
            : updateConfigMutation.error instanceof Error
            ? updateConfigMutation.error.message
            : 'Terjadi kesalahan saat memperbarui pengaturan'}
        </Alert>
      )}

      {(updateRateMutation.isSuccess || updateConfigMutation.isSuccess) && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Pengaturan berhasil diperbarui
        </Alert>
      )}
    </Box>
  );
};

export default SettingsPage; 