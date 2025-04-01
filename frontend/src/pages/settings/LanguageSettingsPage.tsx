import { useState, FC, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { settingsService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageSettings } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }
];

const LanguageSettingsPage: FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const queryClient = useQueryClient();
  const { currentLanguage, setLanguage, translate } = useLanguage();
  
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: settingsService.getLanguageSettings
  });

  useEffect(() => {
    // If settings load and currentLanguage is not in available languages,
    // reset to default language
    if (settings && !settings.availableLanguages.includes(currentLanguage)) {
      setLanguage(settings.defaultLanguage);
    }
  }, [settings, currentLanguage, setLanguage]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<LanguageSettings>) => settingsService.updateLanguageSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languageSettings'] });
      setSnackbar({
        open: true,
        message: translate('languageSettingsSaved') || 'Language settings saved successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: translate('failedToSaveSettings') || 'Failed to save language settings',
        severity: 'error'
      });
    }
  });

  const handleDefaultLanguageChange = (language: string) => {
    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        defaultLanguage: language
      });
      
      // Also update the current language in use
      setLanguage(language);
    }
  };

  const handleAddLanguage = (language: string) => {
    if (settings && !settings.availableLanguages.includes(language)) {
      const newAvailableLanguages = [...settings.availableLanguages, language];
      updateSettingsMutation.mutate({
        ...settings,
        availableLanguages: newAvailableLanguages
      });
      setSelectedLanguage('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    if (settings && settings.availableLanguages.includes(language) && language !== settings.defaultLanguage) {
      const newAvailableLanguages = settings.availableLanguages.filter(lang => lang !== language);
      updateSettingsMutation.mutate({
        ...settings,
        availableLanguages: newAvailableLanguages
      });
      
      // If the currently used language is removed, switch to default
      if (language === currentLanguage) {
        setLanguage(settings.defaultLanguage);
      }
    } else {
      setSnackbar({
        open: true,
        message: translate('cannotRemoveDefaultLanguage') || 'Cannot remove default language',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const getLanguageName = (code: string) => {
    const language = availableLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  // Add a function to switch the UI language immediately without changing default
  const handleSwitchUILanguage = (language: string) => {
    setLanguage(language);
    setSnackbar({
      open: true,
      message: translate('languageChanged') || 'UI language changed',
      severity: 'success'
    });
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
        <Typography color="error">{translate('errorLoadingLanguageSettings') || 'Error loading language settings'}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {translate('language') || 'Language Settings'}
      </Typography>
      <Typography variant="body1" paragraph>
        {translate('configureLanguageSettings') || 'Configure language settings for the system.'}
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {translate('currentUILanguage') || 'Current UI Language'}
        </Typography>
        <Box sx={{ maxWidth: 400, mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="current-language-label">{translate('currentUILanguage') || 'Current UI Language'}</InputLabel>
            <Select
              labelId="current-language-label"
              value={currentLanguage}
              label={translate('currentUILanguage') || 'Current UI Language'}
              onChange={(e) => handleSwitchUILanguage(e.target.value)}
            >
              {settings?.availableLanguages.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {getLanguageName(lang)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          {translate('defaultLanguage') || 'Default Language'}
        </Typography>
        <Box sx={{ maxWidth: 400, mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="default-language-label">{translate('defaultLanguage') || 'Default Language'}</InputLabel>
            <Select
              labelId="default-language-label"
              value={settings?.defaultLanguage || 'en'}
              label={translate('defaultLanguage') || 'Default Language'}
              onChange={(e) => handleDefaultLanguageChange(e.target.value)}
            >
              {settings?.availableLanguages.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {getLanguageName(lang)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          {translate('availableLanguages') || 'Available Languages'}
        </Typography>
        <List>
          {settings?.availableLanguages.map((lang) => (
            <ListItem key={lang}>
              <ListItemText 
                primary={getLanguageName(lang)} 
                secondary={lang === settings.defaultLanguage ? `(${translate('default') || 'Default'})` : 
                           lang === currentLanguage ? `(${translate('current') || 'Current'})` : ''}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  disabled={lang === settings.defaultLanguage}
                  onClick={() => handleRemoveLanguage(lang)}
                  title={translate('removeLanguage') || "Remove Language"}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', mt: 3, maxWidth: 400 }}>
          <FormControl fullWidth sx={{ mr: 1 }}>
            <InputLabel id="add-language-label">{translate('addLanguage') || 'Add Language'}</InputLabel>
            <Select
              labelId="add-language-label"
              value={selectedLanguage}
              label={translate('addLanguage') || 'Add Language'}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {availableLanguages
                .filter(lang => !settings?.availableLanguages.includes(lang.code))
                .map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            disabled={!selectedLanguage} 
            onClick={() => handleAddLanguage(selectedLanguage)}
          >
            {translate('add') || 'Add'}
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

export default LanguageSettingsPage; 