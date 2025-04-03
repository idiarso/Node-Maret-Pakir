import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Slider,
  FormControlLabel,
  Switch,
  Collapse,
  Button,
  Alert
} from '@mui/material';
import {
  PhotoCamera,
  Refresh,
  Settings as SettingsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { cameraService } from '../../services/cameraService';
import { CAMERA_CONFIG } from '../../utils/constants';

interface CameraViewProps {
  width?: number;
  height?: number;
  onSnapshot?: (imageUrl: string) => void;
}

interface CameraSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  quality: number;
}

export const CameraView: React.FC<CameraViewProps> = ({
  width = 640,
  height = 480,
  onSnapshot
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const maxRetries = 3;

  const [settings, setSettings] = useState<CameraSettings>({
    brightness: 50,
    contrast: 50,
    saturation: 50,
    quality: 90
  });

  const loadCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Testing camera connection...');
      const isConnected = await cameraService.testConnection();
      if (!isConnected) {
        throw new Error('Camera connection failed');
      }
      console.log('Camera connection successful');

      if (imgRef.current) {
        console.log('Setting up camera stream...');
        const streamUrl = cameraService.getStreamUrl(settings);
        console.log('Stream URL:', streamUrl);
        imgRef.current.src = streamUrl;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to camera');
      
      if (retryCount < maxRetries) {
        console.log(`Retrying connection (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setTimeout(loadCamera, 2000);
      }
    }
  };

  const handleSnapshot = async () => {
    try {
      setError(null);
      console.log('Taking snapshot...');
      const imageUrl = await cameraService.takeSnapshot(settings);
      console.log('Snapshot taken:', imageUrl);
      if (onSnapshot) {
        onSnapshot(imageUrl);
      }
    } catch (err) {
      console.error('Snapshot error:', err);
      setError('Failed to take snapshot');
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing camera connection...');
    setRetryCount(0);
    loadCamera();
  };

  const handleSettingChange = (setting: keyof CameraSettings) => (
    event: Event,
    value: number | number[]
  ) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value as number
    }));
  };

  const handleSaveSettings = async () => {
    try {
      console.log('Updating camera settings:', settings);
      const success = await cameraService.updateCameraSettings(settings);
      if (success) {
        console.log('Settings updated successfully');
        handleRefresh();
      } else {
        setError('Failed to update camera settings');
      }
    } catch (err) {
      console.error('Settings update error:', err);
      setError('Failed to update camera settings');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image loading error:', e);
    setError('Failed to load camera stream');
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('Initializing camera...');
    loadCamera();
    
    return () => {
      console.log('Cleaning up camera...');
      if (imgRef.current) {
        imgRef.current.src = '';
      }
    };
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width,
          height,
          bgcolor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="primary" />
            <Typography color="white">
              {retryCount > 0 ? `Connecting to camera (Attempt ${retryCount}/${maxRetries})...` : 'Connecting to camera...'}
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography color="text.secondary" variant="body2">
              Camera IP: {CAMERA_CONFIG.ENTRY_CAMERA.ip}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleRefresh}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <img
            ref={imgRef}
            alt="Camera stream"
            onError={handleImageError}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
        <Box>
          <IconButton
            onClick={handleSnapshot}
            disabled={isLoading || !!error}
            color="primary"
            title="Take Snapshot"
          >
            <PhotoCamera />
          </IconButton>
          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
            color="primary"
            title="Refresh Camera"
          >
            <Refresh />
          </IconButton>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={showSettings}
              onChange={(e) => setShowSettings(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SettingsIcon fontSize="small" />
              <Typography variant="body2">Camera Settings</Typography>
            </Box>
          }
        />
      </Box>

      <Collapse in={showSettings} sx={{ width: '100%' }}>
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Image Settings
          </Typography>
          
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>Brightness</Typography>
            <Slider
              value={settings.brightness}
              onChange={handleSettingChange('brightness')}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />

            <Typography gutterBottom>Contrast</Typography>
            <Slider
              value={settings.contrast}
              onChange={handleSettingChange('contrast')}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />

            <Typography gutterBottom>Saturation</Typography>
            <Slider
              value={settings.saturation}
              onChange={handleSettingChange('saturation')}
              min={0}
              max={100}
              valueLabelDisplay="auto"
            />

            <Typography gutterBottom>Quality</Typography>
            <Slider
              value={settings.quality}
              onChange={handleSettingChange('quality')}
              min={1}
              max={100}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              Apply Settings
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}; 