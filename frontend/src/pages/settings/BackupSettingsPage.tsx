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

const BackupSettingsPage: FC = () => {
  const [formData, setFormData] = useState<Partial<BackupSettings>>({
    autoBackup: true,
    backupFrequency: 'DAILY',
    backupTime: '02:00',
    backupLocation: '/backups',
    retentionPeriodDays: 30
  });
  
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const queryClient = useQueryClient();
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['backupSettings'],
    queryFn: settingsService.getBackupSettings,
    onSuccess: (data) => {
      setFormData(data);
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<BackupSettings>) => settingsService.updateBackupSettings(data),
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
    onMutate: () => {
      setIsBackupInProgress(true);
    },
    onSuccess: (data) => {
      setIsBackupInProgress(false);
      queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
      setSnackbar({
        open: true,
        message: data.message || 'Backup completed successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setIsBackupInProgress(false);
      setSnackbar({
        open: true,
        message: 'Failed to create backup',
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

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!formData.autoBackup}>
                  <InputLabel id="backup-frequency-label">Backup Frequency</InputLabel>
                  <Select
                    labelId="backup-frequency-label"
                    name="backupFrequency"
                    value={formData.backupFrequency}
                    label="Backup Frequency"
                    onChange={handleFrequencyChange}
                  >
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="WEEKLY">Weekly</MenuItem>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Backup Time"
                  name="backupTime"
                  type="time"
                  value={formData.backupTime}
                  onChange={handleInputChange}
                  disabled={!formData.autoBackup}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Backup Location"
                  name="backupLocation"
                  value={formData.backupLocation}
                  onChange={handleInputChange}
                  disabled={!formData.autoBackup}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Retention Period (Days)"
                  name="retentionPeriodDays"
                  type="number"
                  value={formData.retentionPeriodDays}
                  onChange={handleInputChange}
                  disabled={!formData.autoBackup}
                  InputProps={{ inputProps: { min: 1, max: 365 } }}
                />
              </Grid>
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Last Backup" 
                    secondary={formatDateTime(settings?.lastBackupAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Next Scheduled Backup" 
                    secondary={formatDateTime(settings?.nextBackupAt)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Automatic Backup" 
                    secondary={
                      <Chip 
                        label={settings?.autoBackup ? 'Enabled' : 'Disabled'} 
                        color={settings?.autoBackup ? 'success' : 'default'}
                        size="small"
                      />
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={isBackupInProgress ? <CircularProgress size={24} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleTriggerBackup}
                disabled={isBackupInProgress || triggerBackupMutation.isPending}
              >
                {isBackupInProgress ? 'Backup in Progress' : 'Create Backup Now'}
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

export default BackupSettingsPage; 