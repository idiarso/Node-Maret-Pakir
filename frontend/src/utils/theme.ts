import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';
import * as storage from './storage';

// Create theme instance
export const createAppTheme = (mode: PaletteMode = 'light'): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#fff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    shape: {
      borderRadius: 8,
    },
  });
};

// Get current theme mode from storage
export const getThemeMode = (): PaletteMode => {
  return storage.getTheme();
};

// Toggle theme mode
export const toggleThemeMode = (currentMode: PaletteMode): PaletteMode => {
  const newMode = currentMode === 'light' ? 'dark' : 'light';
  storage.setTheme(newMode);
  return newMode;
};

export default {
  createAppTheme,
  getThemeMode,
  toggleThemeMode,
}; 