import { useState, FC, useRef, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField,
  Divider,
  Grid,
  InputAdornment,
  Avatar,
  Snackbar,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import { settingsService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemSettings } from '../../types';

const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];
const timeFormats = ['HH:mm:ss', 'HH:mm', 'hh:mm a', 'h:mm a'];

const SystemSettingsPage: FC = () => {
  const [formData, setFormData] = useState<Partial<SystemSettings>>({
    companyName: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    taxId: '',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm'
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
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

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) => settingsService.updateSystemSettings(data),
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogo(e.target.files[0]);
      // In a real implementation, we would upload the logo to a server
      // and update the companyLogo property with the URL
      setFormData({
        ...formData,
        companyLogo: URL.createObjectURL(e.target.files[0])
      });
    }
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
        Configure system-wide settings and company information.
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Company Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                src={formData.companyLogo} 
                alt={formData.companyName} 
                sx={{ width: 100, height: 100, mr: 2 }}
              />
              <Box>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => logoInputRef.current?.click()}
                >
                  Upload Logo
                </Button>
              </Box>
            </Box>
            
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formData.companyName || ''}
              onChange={handleInputChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Tax ID"
              name="taxId"
              value={formData.taxId || ''}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            
            <TextField
              fullWidth
              label="Contact Phone"
              name="contactPhone"
              value={formData.contactPhone || ''}
              onChange={handleInputChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail || ''}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          System Configuration
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Currency"
              name="currency"
              value={formData.currency || 'IDR'}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">Symbol</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Date Format"
              name="dateFormat"
              value={formData.dateFormat || 'DD/MM/YYYY'}
              onChange={handleInputChange}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              {dateFormats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Time Format"
              name="timeFormat"
              value={formData.timeFormat || 'HH:mm'}
              onChange={handleInputChange}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              {timeFormats.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </TextField>
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

export default SystemSettingsPage; 