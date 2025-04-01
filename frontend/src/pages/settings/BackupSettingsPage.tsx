import { useState, FC } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { settingsService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BackupSettings } from '../../types';
import { format } from 'date-fns';
import PageWrapper from '../../components/PageWrapper';

const BackupSettingsContent: FC = () => {
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
    queryKey: ['backupSettings'],
    queryFn: settingsService.getBackupSettings
  });

  const [formData, setFormData] = useState<BackupSettings>({
    autoBackup: settings?.autoBackup || false,
    backupFrequency: settings?.backupFrequency || 'DAILY',
    backupLocation: settings?.backupLocation || 'local',
    cloudServiceUrl: settings?.cloudServiceUrl || '',
    cloudServiceKey: settings?.cloudServiceKey || '',
    lastBackupDate: settings?.lastBackupDate,
    maxBackupCount: settings?.maxBackupCount || 5
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData({
        autoBackup: settings.autoBackup,
        backupFrequency: settings.backupFrequency,
        backupLocation: settings.backupLocation,
        cloudServiceUrl: settings.cloudServiceUrl || '',
        cloudServiceKey: settings.cloudServiceKey || '',
        lastBackupDate: settings.lastBackupDate,
        maxBackupCount: settings.maxBackupCount
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: BackupSettings) => settingsService.updateBackupSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
      setSnackbar({
        open: true,
        message: 'Backup settings saved successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to save backup settings',
        severity: 'error'
      });
    }
  });

  const triggerBackupMutation = useMutation({
    mutationFn: settingsService.triggerBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
      setSnackbar({
        open: true,
        message: 'Backup process started successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to start backup process',
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

  const handleFrequencyChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFormData({
      ...formData,
      backupFrequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY'
    });
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleTriggerBackup = () => {
    triggerBackupMutation.mutate();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const formatDateTime = (date?: Date | string) => {
    if (!date) return 'Never';
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss');
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
        <Typography color="error">Error loading backup settings</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Backup Settings
      </Typography>
      <Typography variant="body1" paragraph>
        Configure system backup settings and manage manual backups.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Automatic Backup Configuration
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoBackup}
                    onChange={handleInputChange}
                    name="autoBackup"
                  />
                }
                label="Enable Automatic Backups"
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!formData.autoBackup}>
                  <InputLabel id="backup-frequency-label">Backup Frequency</InputLabel>
                  <Select
                    labelId="backup-frequency-label"
                    value={formData.backupFrequency}
                    label="Backup Frequency"
                    onChange={handleFrequencyChange}
                    name="backupFrequency"
                  >
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Backups to Keep"
                  type="number"
                  name="maxBackupCount"
                  value={formData.maxBackupCount}
                  onChange={handleInputChange}
                  disabled={!formData.autoBackup}
                  helperText="Older backups will be automatically deleted"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Backup Location
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="backup-location-label">Backup Storage Location</InputLabel>
                  <Select
                    labelId="backup-location-label"
                    value={formData.backupLocation}
                    label="Backup Storage Location"
                    onChange={handleInputChange}
                    name="backupLocation"
                  >
                    <MenuItem value="local">Local Storage</MenuItem>
                    <MenuItem value="cloud">Cloud Storage</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.backupLocation === 'cloud' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cloud Service URL"
                      name="cloudServiceUrl"
                      value={formData.cloudServiceUrl}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cloud Service API Key"
                      name="cloudServiceKey"
                      value={formData.cloudServiceKey}
                      onChange={handleInputChange}
                      type="password"
                    />
                  </Grid>
                </>
              )}
            </Grid>

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
                Manual Backup
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Start a new backup process manually or restore from an existing backup.
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Last backup: {formatDateTime(settings?.lastBackupDate)}
              </Typography>
              
              <List>
                {settings?.recentBackups?.map((backup, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={formatDateTime(backup.date)} 
                      secondary={`Size: ${backup.size}`} 
                    />
                    <Chip 
                      size="small" 
                      label={backup.type} 
                      color={backup.type === 'FULL' ? 'primary' : 'secondary'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleTriggerBackup}
                disabled={triggerBackupMutation.isPending}
              >
                Backup Now
              </Button>
            </CardActions>
          </Card>
          
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Restore Backup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Restore your system from a previously created backup. This will replace current data.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary"
                startIcon={<CloudDownloadIcon />}
              >
                Restore From Backup
              </Button>
            </CardActions>
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
const BackupSettingsPage: FC = () => {
  return (
    <PageWrapper title="Backup Settings">
      <BackupSettingsContent />
    </PageWrapper>
  );
};

export default BackupSettingsPage; 