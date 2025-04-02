import { useState, FC, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
  AlertColor,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import { settingsService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BackupSettings } from '../../types';
import { format } from 'date-fns';
import PageWrapper from '../../components/PageWrapper';
import React from 'react';

const BackupSettingsContent: FC = () => {
  const [formData, setFormData] = useState<BackupSettings>({
    auto_backup: false,
    backup_frequency: 'DAILY',
    backup_time: '00:00',
    backup_location: 'local',
    keep_backups: 5
  });

  // State untuk dialog backup dengan nama kustom
  const [openBackupDialog, setOpenBackupDialog] = useState(false);
  const [customBackupName, setCustomBackupName] = useState('');
  const [backupFormat, setBackupFormat] = useState<'json' | 'sql'>('json');
  
  // State untuk dialog upload restore
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [useOriginalName, setUseOriginalName] = useState(true);
  
  // State untuk daftar backup
  const [backupList, setBackupList] = useState<any[]>([]);
  
  // Referensi ke input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const queryClient = useQueryClient();

  // Get backup settings
  const { 
    data: settings, 
    isLoading: isLoadingSettings, 
    error: settingsError 
  } = useQuery({
    queryKey: ['backupSettings'],
    queryFn: settingsService.getBackupSettings
  });
  
  // Get backup list
  const { 
    data: backups, 
    isLoading: isLoadingBackups, 
    error: backupsError,
    refetch: refetchBackups
  } = useQuery({
    queryKey: ['backupList'],
    queryFn: settingsService.listBackups
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData({
        auto_backup: settings.auto_backup,
        backup_frequency: settings.backup_frequency,
        backup_location: settings.backup_location,
        backup_time: settings.backup_time || '00:00',
        keep_backups: settings.keep_backups || 5,
        last_backup: settings.last_backup,
        cloud_service_url: settings.cloud_service_url,
        cloud_service_key: settings.cloud_service_key,
        recent_backups: settings.recent_backups
      });
    }
  }, [settings]);

  // Update backupList when data changes
  React.useEffect(() => {
    if (backups) {
      setBackupList(backups);
    }
  }, [backups]);

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
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setSnackbar({
        open: true,
        message: 'Backup process completed successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Failed to complete backup process',
        severity: 'error'
      });
    }
  });
  
  // Mutasi untuk backup dengan nama kustom dan format
  const triggerNamedBackupMutation = useMutation({
    mutationFn: (params: { name: string, format: 'json' | 'sql' }) => 
      settingsService.triggerBackupWithName(params.name, params.format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setSnackbar({
        open: true,
        message: 'Named backup created successfully',
        severity: 'success'
      });
      setOpenBackupDialog(false);
      setCustomBackupName('');
      setBackupFormat('json'); // Reset to default
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Failed to create named backup: ${error?.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  });
  
  // Mutasi untuk upload file backup
  const uploadBackupMutation = useMutation({
    mutationFn: (data: { file: File, useOriginal: boolean }) => 
      settingsService.uploadBackup(data.file, data.useOriginal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setSnackbar({
        open: true,
        message: 'Backup file uploaded successfully',
        severity: 'success'
      });
      setOpenRestoreDialog(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Failed to upload backup file: ${error?.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  });
  
  // Mutasi untuk restore backup
  const restoreBackupMutation = useMutation({
    mutationFn: (filename: string) => settingsService.restoreBackup(filename),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Backup restored successfully',
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Failed to restore backup: ${error?.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  });
  
  // Mutasi untuk menghapus backup
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => settingsService.deleteBackup(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupList'] });
      setSnackbar({
        open: true,
        message: 'Backup deleted successfully',
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Failed to delete backup: ${error?.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    }
  });

  // State untuk dialog download
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [customDownloadName, setCustomDownloadName] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFrequencyChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      backup_frequency: e.target.value
    });
  };

  const handleLocationChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      backup_location: e.target.value
    });
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleTriggerBackup = () => {
    triggerBackupMutation.mutate();
  };
  
  // Handle backup dengan nama kustom
  const handleOpenBackupDialog = () => {
    setOpenBackupDialog(true);
  };
  
  const handleCloseBackupDialog = () => {
    setOpenBackupDialog(false);
    setCustomBackupName('');
  };
  
  const handleCreateNamedBackup = () => {
    if (customBackupName.trim()) {
      triggerNamedBackupMutation.mutate({ 
        name: customBackupName.trim(),
        format: backupFormat 
      });
    }
  };
  
  // Handle upload file
  const handleOpenRestoreDialog = () => {
    setOpenRestoreDialog(true);
  };
  
  const handleCloseRestoreDialog = () => {
    setOpenRestoreDialog(false);
    setUseOriginalName(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUploadBackup = () => {
    if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
      uploadBackupMutation.mutate({
        file: fileInputRef.current.files[0],
        useOriginal: useOriginalName
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a file to upload',
        severity: 'warning'
      });
    }
  };
  
  // Handle restore backup
  const handleRestoreBackup = (filename: string) => {
    if (window.confirm(`Are you sure you want to restore from backup '${filename}'? This will replace current data.`)) {
      restoreBackupMutation.mutate(filename);
    }
  };
  
  // Handle delete backup
  const handleDeleteBackup = (filename: string) => {
    if (window.confirm(`Are you sure you want to delete backup '${filename}'? This action cannot be undone.`)) {
      deleteBackupMutation.mutate(filename);
    }
  };

  // Handle download backup
  const handleOpenDownloadDialog = (filename: string) => {
    setDownloadFilename(filename);
    setCustomDownloadName('');
    setOpenDownloadDialog(true);
  };

  const handleCloseDownloadDialog = () => {
    setOpenDownloadDialog(false);
    setDownloadFilename('');
    setCustomDownloadName('');
  };

  const handleDownloadBackup = () => {
    settingsService.downloadBackup(downloadFilename, customDownloadName);
    setOpenDownloadDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const formatDateTime = (date?: Date | string) => {
    if (!date) return 'Never';
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss');
  };

  const isLoading = isLoadingSettings || isLoadingBackups;
  const error = settingsError || backupsError;

  // Handle perubahan format backup
  const handleBackupFormatChange = (event: SelectChangeEvent) => {
    setBackupFormat(event.target.value as 'json' | 'sql');
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
                    checked={formData.auto_backup}
                    onChange={handleInputChange}
                    name="auto_backup"
                  />
                }
                label="Enable Automatic Backups"
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!formData.auto_backup}>
                  <InputLabel id="backup-frequency-label">Backup Frequency</InputLabel>
                  <Select
                    labelId="backup-frequency-label"
                    value={formData.backup_frequency}
                    label="Backup Frequency"
                    onChange={handleFrequencyChange}
                    name="backup_frequency"
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
                  name="keep_backups"
                  value={formData.keep_backups}
                  onChange={handleInputChange}
                  disabled={!formData.auto_backup}
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
                    value={formData.backup_location}
                    label="Backup Storage Location"
                    onChange={handleLocationChange}
                    name="backup_location"
                  >
                    <MenuItem value="local">Local Storage</MenuItem>
                    <MenuItem value="cloud">Cloud Storage</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.backup_location === 'cloud' && formData.cloud_service_url !== undefined && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cloud Service URL"
                      name="cloud_service_url"
                      value={formData.cloud_service_url || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cloud Service API Key"
                      name="cloud_service_key"
                      value={formData.cloud_service_key || ''}
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
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </Box>
          </Paper>
          
          {/* Backup Files List */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Backups
            </Typography>
            
            {isLoadingBackups ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : backupList.length > 0 ? (
              <List>
                {backupList.map((backup, index) => (
                  <ListItem key={index} 
                    secondaryAction={
                      <Box>
                        <Tooltip title="Download this backup">
                          <IconButton 
                            edge="end" 
                            aria-label="download"
                            onClick={() => handleOpenDownloadDialog(backup.filename)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Restore from this backup">
                          <IconButton 
                            edge="end" 
                            aria-label="restore"
                            onClick={() => handleRestoreBackup(backup.filename)}
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete this backup">
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDeleteBackup(backup.filename)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText 
                      primary={backup.filename} 
                      secondary={`Size: ${backup.size} | Created: ${formatDateTime(backup.created_at)}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No backup files available
              </Typography>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => refetchBackups()}
                sx={{ mr: 1 }}
              >
                Refresh List
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manual Backup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a new backup process manually with automatic or custom name.
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Last backup: {formatDateTime(formData.last_backup)}
              </Typography>
            </CardContent>
            <CardActions sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
              <Button 
                fullWidth 
                variant="contained" 
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleTriggerBackup}
                sx={{ mb: 1 }}
              >
                Quick Backup
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={handleOpenBackupDialog}
              >
                Backup With Custom Name
              </Button>
            </CardActions>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Restore From File
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a backup file to restore your system. This will allow you to select from existing backups.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary"
                startIcon={<CloudDownloadIcon />}
                onClick={handleOpenRestoreDialog}
              >
                Upload Backup File
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog untuk backup dengan nama kustom */}
      <Dialog open={openBackupDialog} onClose={handleCloseBackupDialog}>
        <DialogTitle>Create Backup with Custom Name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for your backup file. The extension will be added automatically based on the selected format.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Backup Name"
            fullWidth
            variant="outlined"
            value={customBackupName}
            onChange={(e) => setCustomBackupName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="backup-format-label">Backup Format</InputLabel>
            <Select
              labelId="backup-format-label"
              value={backupFormat}
              label="Backup Format"
              onChange={handleBackupFormatChange}
            >
              <MenuItem value="json">JSON (Metadata Format)</MenuItem>
              <MenuItem value="sql">SQL (Database Script)</MenuItem>
            </Select>
            <Typography variant="caption" sx={{ mt: 1 }}>
              {backupFormat === 'json' 
                ? 'JSON format contains database structure and sample data in a portable format.'
                : 'SQL format contains full database structure and SQL statements for data restoration.'}
            </Typography>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBackupDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateNamedBackup} 
            color="primary"
            disabled={!customBackupName.trim()}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog untuk upload file backup */}
      <Dialog open={openRestoreDialog} onClose={handleCloseRestoreDialog}>
        <DialogTitle>Upload Backup File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a backup file to upload. Only .json and .sql files are supported.
          </DialogContentText>
          <input
            type="file"
            accept=".json,.sql"
            ref={fileInputRef}
            style={{ marginTop: '16px', marginBottom: '16px' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={useOriginalName}
                onChange={(e) => setUseOriginalName(e.target.checked)}
              />
            }
            label="Use original filename"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRestoreDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleUploadBackup} 
            color="primary"
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog untuk download backup dengan nama kustom */}
      <Dialog open={openDownloadDialog} onClose={handleCloseDownloadDialog}>
        <DialogTitle>Download Backup with Custom Name</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can download "{downloadFilename}" with its original name or specify a custom name. The file extension will be preserved.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Custom Download Name (optional)"
            fullWidth
            variant="outlined"
            value={customDownloadName}
            onChange={(e) => setCustomDownloadName(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Leave empty to use original filename"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDownloadDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDownloadBackup} 
            color="primary"
            startIcon={<CloudDownloadIcon />}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

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