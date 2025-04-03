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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { settingsService } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LanguageSettings } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import PageWrapper from '../../components/PageWrapper';

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

const LanguageSettingsContent: FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Add fallback data for when API fails
  const fallbackData: LanguageSettings = {
    default_language: 'id',
    available_languages: ['en', 'id', 'ja'],
    translations: {
      language: {
        en: 'Language',
        id: 'Bahasa',
        ja: '言語'
      },
      settings: {
        en: 'Settings',
        id: 'Pengaturan',
        ja: '設定'
      }
    }
  };
  
  const queryClient = useQueryClient();
  const { currentLanguage, setLanguage, translate } = useLanguage();
  
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['languageSettings'],
    queryFn: settingsService.getLanguageSettings,
    retry: 1, // Only retry once
    retryDelay: 1000,
  });

  // Use fallback data if API fails
  const effectiveSettings = settings && settings.available_languages ? settings : fallbackData;

  useEffect(() => {
    // If settings load and currentLanguage is not in available languages,
    // reset to default language
    if (effectiveSettings && !effectiveSettings.available_languages.includes(currentLanguage)) {
      setLanguage(effectiveSettings.default_language);
    }
  }, [effectiveSettings, currentLanguage, setLanguage]);

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
    if (effectiveSettings) {
      updateSettingsMutation.mutate({
        ...effectiveSettings,
        default_language: language
      });
      
      // Also update the current language in use
      setLanguage(language);
    }
  };

  const handleAddLanguage = (language: string) => {
    if (effectiveSettings && !effectiveSettings.available_languages.includes(language)) {
      const newAvailableLanguages = [...effectiveSettings.available_languages, language];
      updateSettingsMutation.mutate({
        ...effectiveSettings,
        available_languages: newAvailableLanguages
      });
      setSelectedLanguage('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    if (effectiveSettings && effectiveSettings.available_languages.includes(language) && language !== effectiveSettings.default_language) {
      const newAvailableLanguages = effectiveSettings.available_languages.filter(lang => lang !== language);
      updateSettingsMutation.mutate({
        ...effectiveSettings,
        available_languages: newAvailableLanguages
      });
      
      // If the currently used language is removed, switch to default
      if (language === currentLanguage) {
        setLanguage(effectiveSettings.default_language);
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

  // If there's an error or invalid data, show warning but continue with fallback data
  if (error || (settings && !settings.available_languages)) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {translate('usingOfflineData') || 'Using offline data due to server error. Changes will only be applied locally.'}
        </Alert>
        
        <Typography variant="h4" gutterBottom>
          {translate('language') || 'Language Settings'}
        </Typography>
        
        {renderContent(fallbackData)}
      </Box>
    );
  }

  // Extract the main content rendering to avoid duplication
  function renderContent(data: LanguageSettings) {
    return (
      <>
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
                {data.available_languages.map((lang) => (
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
                value={data.default_language || 'en'}
                label={translate('defaultLanguage') || 'Default Language'}
                onChange={(e) => handleDefaultLanguageChange(e.target.value)}
              >
                {data.available_languages.map((lang) => (
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
            {data.available_languages.map((lang) => (
              <ListItem key={lang}>
                <ListItemText 
                  primary={getLanguageName(lang)} 
                  secondary={lang === data.default_language ? `(${translate('default') || 'Default'})` : 
                            lang === currentLanguage ? `(${translate('current') || 'Current'})` : ''}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    disabled={lang === data.default_language}
                    onClick={() => handleRemoveLanguage(lang)}
                    title={translate('removeLanguage') || "Remove Language"}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <FormControl fullWidth sx={{ mr: 1 }}>
              <InputLabel id="add-language-label">{translate('addLanguage') || 'Add Language'}</InputLabel>
              <Select
                labelId="add-language-label"
                value={selectedLanguage}
                label={translate('addLanguage') || 'Add Language'}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {availableLanguages
                  .filter(lang => !data.available_languages.includes(lang.code))
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
      </>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {translate('language') || 'Language Settings'}
      </Typography>
      {renderContent(effectiveSettings)}
    </Box>
  );
};

// Wrap the component with PageWrapper for error boundary
const LanguageSettingsPage: FC = () => {
  return (
    <PageWrapper title="Language Settings">
      <LanguageSettingsContent />
    </PageWrapper>
  );
};

export default LanguageSettingsPage; 