import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { ApplyAllButton } from '../components/common/ApplyAllButton';

interface SystemSettings {
  parkingFee: number;
  maxParkingSpots: number;
  enableAutomaticBilling: boolean;
  notificationEmail: string;
}

const SettingsPage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      const response = await axios.put(
        'http://localhost:3000/api/settings',
        newSettings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setSuccessMessage('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      setErrorMessage('Failed to update settings');
      console.error('Update error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSettings: SystemSettings = {
      parkingFee: Number(formData.get('parkingFee')),
      maxParkingSpots: Number(formData.get('maxParkingSpots')),
      enableAutomaticBilling: formData.get('enableAutomaticBilling') === 'true',
      notificationEmail: formData.get('notificationEmail') as string,
    };
    updateSettingsMutation.mutate(newSettings);
  };

  const handleApplyAll = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Pengaturan Sistem</Typography>
        <Box>
          <ApplyAllButton
            onApply={handleApplyAll}
            isPending={updateSettingsMutation.isPending}
            title="Terapkan Semua Pengaturan"
            message="Apakah Anda yakin ingin menerapkan semua perubahan pengaturan?"
          />
        </Box>
      </Box>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parking Fee (per hour)"
                  name="parkingFee"
                  type="number"
                  defaultValue={settings?.parkingFee}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum Parking Spots"
                  name="maxParkingSpots"
                  type="number"
                  defaultValue={settings?.maxParkingSpots}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="enableAutomaticBilling"
                      defaultChecked={settings?.enableAutomaticBilling}
                    />
                  }
                  label="Enable Automatic Billing"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notification Email"
                  name="notificationEmail"
                  type="email"
                  defaultValue={settings?.notificationEmail}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={updateSettingsMutation.isPending}
                >
                  Save Settings
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage; 