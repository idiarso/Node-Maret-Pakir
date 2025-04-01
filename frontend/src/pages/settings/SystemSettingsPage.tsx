import React, { useState, FC } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Snackbar,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { settingsService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemSettings } from '../../types';
import PageWrapper from '../../components/PageWrapper';

const SystemSettingsContent: FC = () => {
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const queryClient = useQueryClient();
  
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: settingsService.getSystemSettings
  });

  const [formData, setFormData] = useState<SystemSettings>({
    systemName: settings?.systemName || 'Parking Management System',
    companyName: settings?.companyName || '',
    contactEmail: settings?.contactEmail || '',
    contactPhone: settings?.contactPhone || '',
    sessionTimeout: settings?.sessionTimeout || 30,
    enableNotifications: settings?.enableNotifications || true,
    maintenanceMode: settings?.maintenanceMode || false,
    maxParkingTime: settings?.maxParkingTime || 24,
    currency: settings?.currency || 'IDR',
    taxRate: settings?.taxRate || 10
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData({
        ...settings
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SystemSettings) => settingsService.updateSystemSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setSnackbar({
        open: true,
        message: 'System settings saved successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to save system settings',
        severity: 'error'
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading system settings</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      <Typography variant="body1" paragraph>
        Configure global system settings and preferences.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Organization Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="System Name"
                  name="systemName"
                  value={formData.systemName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              System Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 5, max: 120 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Parking Time (hours)"
                  name="maxParkingTime"
                  type="number"
                  value={formData.maxParkingTime}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  name="taxRate"
                  type="number"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableNotifications}
                    onChange={handleInputChange}
                    name="enableNotifications"
                  />
                }
                label="Enable System Notifications"
              />
            </Box>

            <Box sx={{ mt: 2, mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.maintenanceMode}
                    onChange={handleInputChange}
                    name="maintenanceMode"
                  />
                }
                label="Maintenance Mode"
              />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                Save Settings
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Version" secondary={settings?.version || "1.0.0"} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Environment" secondary={process.env.NODE_ENV || "development"} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Last Updated" secondary={settings?.lastUpdated ? new Date(settings.lastUpdated).toLocaleString() : "Unknown"} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Current system status and performance indicators.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Server Status" secondary={settings?.serverStatus || "Online"} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Database Status" secondary={settings?.databaseStatus || "Connected"} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Active Users" secondary={settings?.activeUsers || "0"} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="System Load" secondary={settings?.systemLoad || "Normal"} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Wrap the component with PageWrapper for error boundary
const SystemSettingsPage: FC = () => {
  return (
    <PageWrapper title="System Settings">
      <SystemSettingsContent />
    </PageWrapper>
  );
};

export default SystemSettingsPage; 