import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface SystemSettings {
  general: {
    siteName: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowSpaceAlert: boolean;
    deviceOfflineAlert: boolean;
  };
  security: {
    requireLogin: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordExpiryDays: number;
  };
  maintenance: {
    maintenanceMode: boolean;
    backupFrequency: string;
    retentionPeriod: number;
  };
}

const SystemSettings: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['systemSettings'],
    queryFn: async (): Promise<SystemSettings> => {
      const response = await axios.get<SystemSettings>(
        'http://localhost:3000/api/settings',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettings): Promise<SystemSettings> => {
      const response = await axios.put<SystemSettings>(
        'http://localhost:3000/api/settings',
        newSettings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setSnackbar({
        open: true,
        message: 'Settings updated successfully',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to update settings',
        severity: 'error',
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  const handleChange = (
    section: keyof SystemSettings,
    field: string,
    value: string | number | boolean
  ) => {
    if (settings) {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [field]: value,
        },
      };
      updateSettingsMutation.mutate(newSettings);
    }
  };

  if (isLoading) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Settings
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* General Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                General Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Site Name"
                    value={settings?.general.siteName || ''}
                    onChange={(e) =>
                      handleChange('general', 'siteName', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Timezone"
                    value={settings?.general.timezone || ''}
                    onChange={(e) =>
                      handleChange('general', 'timezone', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date Format"
                    value={settings?.general.dateFormat || ''}
                    onChange={(e) =>
                      handleChange('general', 'dateFormat', e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value={settings?.general.currency || ''}
                    onChange={(e) =>
                      handleChange('general', 'currency', e.target.value)
                    }
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Notification Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Notification Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.notifications.emailNotifications || false}
                        onChange={(e) =>
                          handleChange(
                            'notifications',
                            'emailNotifications',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.notifications.smsNotifications || false}
                        onChange={(e) =>
                          handleChange(
                            'notifications',
                            'smsNotifications',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="SMS Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.notifications.lowSpaceAlert || false}
                        onChange={(e) =>
                          handleChange(
                            'notifications',
                            'lowSpaceAlert',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Low Space Alert"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.notifications.deviceOfflineAlert || false}
                        onChange={(e) =>
                          handleChange(
                            'notifications',
                            'deviceOfflineAlert',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Device Offline Alert"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Security Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.security.requireLogin || false}
                        onChange={(e) =>
                          handleChange(
                            'security',
                            'requireLogin',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Require Login"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Session Timeout (minutes)"
                    value={settings?.security.sessionTimeout || ''}
                    onChange={(e) =>
                      handleChange(
                        'security',
                        'sessionTimeout',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Login Attempts"
                    value={settings?.security.maxLoginAttempts || ''}
                    onChange={(e) =>
                      handleChange(
                        'security',
                        'maxLoginAttempts',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Password Expiry (days)"
                    value={settings?.security.passwordExpiryDays || ''}
                    onChange={(e) =>
                      handleChange(
                        'security',
                        'passwordExpiryDays',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Maintenance Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Maintenance Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.maintenance.maintenanceMode || false}
                        onChange={(e) =>
                          handleChange(
                            'maintenance',
                            'maintenanceMode',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Maintenance Mode"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Backup Frequency"
                    value={settings?.maintenance.backupFrequency || ''}
                    onChange={(e) =>
                      handleChange(
                        'maintenance',
                        'backupFrequency',
                        e.target.value
                      )
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retention Period (days)"
                    value={settings?.maintenance.retentionPeriod || ''}
                    onChange={(e) =>
                      handleChange(
                        'maintenance',
                        'retentionPeriod',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                >
                  Save Changes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default SystemSettings; 