import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, Grid, Paper, Divider, IconButton } from '@mui/material';
import { QrCodeScanner as ScannerIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  width?: number;
  height?: number;
  stopOnDetect?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  width = 300, 
  height = 150 
}) => {
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    // Focus the input field when manual input is enabled
    setTimeout(() => {
      if (!showManualInput && inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h2">Scan Barcode</Typography>
            <IconButton 
              color={showManualInput ? "primary" : "default"} 
              onClick={toggleManualInput} 
              title="Toggle manual input"
            >
              <KeyboardIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        {!showManualInput ? (
          <Grid item xs={12}>
            <Box 
              sx={{ 
                width: '100%', 
                height, 
                border: '1px dashed #ccc', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                borderRadius: 1,
                bgcolor: 'background.paper',
                p: 2
              }}
            >
              <ScannerIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
              <Typography variant="body1" align="center" gutterBottom>
                Scan ticket barcode
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                Position barcode in front of scanner
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => onScan(Math.floor(Math.random() * 10000).toString())}
              >
                Simulate Scan
              </Button>
            </Box>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <Box component="form" onSubmit={handleManualSubmit} sx={{ width: '100%' }}>
              <Typography variant="body2" gutterBottom>
                Enter ticket ID or barcode number manually:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={9}>
                  <TextField
                    inputRef={inputRef}
                    fullWidth
                    size="small"
                    label="Ticket ID / Barcode"
                    variant="outlined"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter ticket number"
                    autoFocus
                  />
                </Grid>
                <Grid item xs={3}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    sx={{ height: '100%' }}
                    disabled={!manualInput.trim()}
                  >
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
            {showManualInput 
              ? "Switch back to scanner mode if your scanner is working" 
              : "Use manual input if the scanner is not working"}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BarcodeScanner; 