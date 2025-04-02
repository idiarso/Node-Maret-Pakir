import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Container,
  Box,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Fade,
  Stack,
  IconButton,
  InputAdornment,
  useTheme
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { parkingSessionService, gateService } from '../services/api';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';
import { useTranslation } from 'react-i18next';
import { formatDateTime, formatCurrency } from '../utils/format';
import {
  DirectionsCar as CarIcon,
  QrCodeScanner as ScanIcon,
  Keyboard as KeyboardIcon,
  CreditCard as PaymentIcon,
  Receipt as ReceiptIcon,
  Timer as TimerIcon,
  LocalParking as ParkingIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  BarChart as BarcodeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import Breadcrumbs from '../components/Breadcrumbs';
import { keyframes } from '@mui/system';

interface ActiveSession {
  id: number;
  vehicle: {
  id: number;
  plate_number: string;
  type: string;
  };
  entry_time: string;
  exit_time?: string;
  status: string;
  parkingArea?: {
    id: number;
    name: string;
  };
}

interface ExitFormData {
  session_id: number;
}

interface Gate {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// Define the scanLine animation
const scanLine = keyframes`
  0% {
    transform: translateY(-50px);
  }
  50% {
    transform: translateY(50px);
  }
  100% {
    transform: translateY(-50px);
  }
`;

const ExitGatePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<number | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper functions for parking calculations
  const calculateParkingDuration = (entryTime: Date, exitTime: Date): number => {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    return durationMs / (1000 * 60 * 60); // Duration in hours
  };
  
  const calculateParkingFee = (vehicleType: string, durationHours: number): number => {
    let baseFee = 0;
    let hourlyRate = 0;
    
    switch (vehicleType) {
      case 'CAR':
        baseFee = 5;
        hourlyRate = 2;
        break;
      case 'MOTORCYCLE':
        baseFee = 3;
        hourlyRate = 1;
        break;
      case 'TRUCK':
        baseFee = 10;
        hourlyRate = 4;
        break;
      default:
        baseFee = 5;
        hourlyRate = 2;
    }
    
    return baseFee + (hourlyRate * Math.ceil(durationHours));
  };

  // Calculate derived values
  const duration = activeSession ? calculateParkingDuration(new Date(activeSession.entry_time), new Date()) : 0;
  const parkingFee = activeSession ? calculateParkingFee(activeSession.vehicle.type, duration) : 0;
  const taxAmount = parkingFee * 0.1;
  const totalAmount = parkingFee + taxAmount;

  // Get all gates
  const { data: gatesData } = useQuery({
    queryKey: ['exit-gates'],
    queryFn: async () => {
      const allGates = await gateService.getAll();
      return allGates.filter(gate => gate.type === 'EXIT' && gate.status === 'ACTIVE');
    }
  });

  useEffect(() => {
    if (gatesData) {
      setGates(gatesData);
      // Set first gate as default if available
      if (gatesData.length > 0 && !selectedGate) {
        setSelectedGate(gatesData[0].id);
      }
    }
  }, [gatesData]);

  // Focus input field when switching to manual mode
  useEffect(() => {
    if (scanMode === 'manual' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [scanMode]);

  // Process barcode to find session
  const getSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      return parkingSessionService.getSession(code);
    },
    onSuccess: (data) => {
      setActiveSession(data as ActiveSession);
      setSnackbar({
        open: true,
        message: 'Kendaraan ditemukan',
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setActiveSession(null);
      setError(`Error: ${error.message || 'Gagal menemukan kendaraan'}`);
      setSnackbar({
        open: true,
        message: error.message || 'Gagal menemukan kendaraan',
        severity: 'error'
      });
    }
  });

  // Process exit mutation
  const processExitMutation = useMutation({
    mutationFn: async (data: ExitFormData) => {
      return parkingSessionService.processExit(data);
    },
    onSuccess: () => {
      setExitDialogOpen(false);
      setReceiptDialogOpen(true);
      setSnackbar({
        open: true,
        message: 'Kendaraan berhasil keluar',
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setError(`Error: ${error.message || 'Gagal memproses keluar'}`);
      setSnackbar({
        open: true,
        message: error.message || 'Gagal memproses keluar',
        severity: 'error'
      });
    }
  });

  const handleBarcodeScanned = (code: string) => {
    processBarcode(code);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processBarcode(manualInput.trim());
      setManualInput('');
    }
  };

  const processBarcode = async (barcodeData: string) => {
    if (!barcodeData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await getSessionMutation.mutateAsync(barcodeData);
    } catch (error) {
      console.error('Error processing barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExit = () => {
    if (!activeSession) {
      setError('No vehicle details available');
      return;
    }
    
    processExitMutation.mutate({
      session_id: activeSession.id,
    });
  };

  const handleOpenExitDialog = () => {
    setExitDialogOpen(true);
  };

  const handleCloseExitDialog = () => {
    setExitDialogOpen(false);
  };

  const handleCloseReceiptDialog = () => {
    setReceiptDialogOpen(false);
    // Reset state
    setActiveSession(null);
    setSelectedGate(null);
  };

  const handleOpenGate = async () => {
    if (!selectedGate) {
      setError('Please select a gate');
      return;
    }
    
    try {
      // This would be a call to open the physical gate
      console.log(`Opening gate ${selectedGate}...`);
      setError(null);
      
      // Use changeStatus instead of openGate
      await gateService.changeStatus(selectedGate, 'OPEN');
      
      handleCloseReceiptDialog();
    } catch (error: any) {
      console.error('Error opening gate:', error);
      setError('Failed to open gate. Please try again.');
      setSnackbar({
        open: true,
        message: error.message || 'Unknown error',
        severity: 'error'
      });
    }
  };

  const toggleScanMode = () => {
    setScanMode(scanMode === 'camera' ? 'manual' : 'camera');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({...prev, open: false}));
  };

  const renderVehicleDetails = () => {
    if (!activeSession) return null;

    const entryTime = new Date(activeSession.entry_time);
    const currentTime = new Date();
    const durationHours = calculateParkingDuration(entryTime, currentTime);
    const durationFormatted = `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`;
    
    return (
      <Fade in={true} timeout={500}>
        <Card elevation={3} sx={{ mt: 3, overflow: 'visible', position: 'relative' }}>
          <CardHeader
            title="Informasi Kendaraan"
            action={
              <Chip
                label={activeSession.vehicle.type === 'CAR' ? 'Mobil' : 
                       activeSession.vehicle.type === 'MOTORCYCLE' ? 'Motor' : 
                       activeSession.vehicle.type === 'TRUCK' ? 'Truk' : 
                       activeSession.vehicle.type}
                color="primary"
                icon={<CarIcon />}
                sx={{ fontWeight: 'bold' }}
              />
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nomor Plat</Typography>
                    <Typography variant="h5" fontWeight="bold">{activeSession.vehicle.plate_number}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">Waktu Masuk</Typography>
                    <Typography variant="body1">{formatDateTime(entryTime)}</Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">Area Parkir</Typography>
                    <Typography variant="body1">{activeSession.parkingArea?.name || 'Main Area'}</Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Durasi Parkir</Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
                      {durationFormatted}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">Biaya Parkir</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                      <PaymentIcon sx={{ mr: 1, color: 'success.main' }} />
                      {formatCurrency(parkingFee)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total (termasuk pajak 10%)</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={handleOpenExitDialog}
                startIcon={<ParkingIcon />}
                disabled={loading || processExitMutation.isPending}
                sx={{ borderRadius: 8, px: 4, py: 1.5 }}
              >
                {processExitMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Proses Keluar'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  };

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Exit Gate' },
        ]}
      />
      
      <PageHeader
        title="Exit Gate"
        subtitle="Proses kendaraan keluar dan pembayaran"
      />
      
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
              <BarcodeIcon sx={{ mr: 1, color: 'primary.main' }} />
              Barcode Tiket
            </Typography>
            
            <Button
              startIcon={scanMode === 'camera' ? <KeyboardIcon /> : <BarcodeIcon />}
              variant="outlined"
              onClick={toggleScanMode}
            >
              {scanMode === 'camera' ? 'Input Manual' : 'Mode Barcode'}
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {scanMode === 'camera' ? (
            <Box>
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 200,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: theme.palette.background.default,
                  mb: 2,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box sx={{
                    position: 'relative',
                    width: '80%',
                    height: '100px',
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      width: '100%',
                      height: '2px',
                      bgcolor: 'error.main',
                      animation: `${scanLine} 2s linear infinite`,
                      zIndex: 1,
                      boxShadow: '0px 0px 8px rgba(255, 0, 0, 0.8)'
                    }} />
                    <Box component="img" 
                      src="/barcode-example.png" 
                      alt="Barcode Example"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0.15,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                </Box>
                
                <BarcodeIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main', zIndex: 2 }} />
                <Typography variant="body1" align="center" fontWeight="medium" gutterBottom sx={{ zIndex: 2 }}>
                  Scan barcode tiket
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ zIndex: 2 }}>
                  Posisikan barcode di bawah scanner
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="medium"
                  onClick={() => handleBarcodeScanned("T" + Math.floor(Math.random() * 10000).toString().padStart(5, '0'))}
                  startIcon={<BarcodeIcon />}
                >
                  Simulasi Scan
                </Button>
              </Box>
              
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'info.light', 
                color: 'info.contrastText',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center'
              }}>
                <InfoIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Pastikan barcode berada dalam posisi horizontal dan terlihat jelas.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleManualSubmit}>
              <TextField
                inputRef={inputRef}
                fullWidth
                label="Masukkan ID Tiket / Nomor Barcode"
                variant="outlined"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Contoh: T12345 atau nomor barcode"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        color="primary" 
                        onClick={handleManualSubmit}
                        disabled={!manualInput.trim() || loading}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="caption" color="text.secondary">
                Masukkan nomor tiket atau ID barcode dan tekan Enter untuk mencari
              </Typography>
            </Box>
          )}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress size={40} />
            </Box>
          )}
          
          {error && !loading && (
            <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Paper>
        
        {renderVehicleDetails()}
        
        {/* Exit Confirmation Dialog */}
        <Dialog open={exitDialogOpen} onClose={handleCloseExitDialog}>
          <DialogTitle>Konfirmasi Keluar</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Apakah Anda yakin ingin memproses keluar kendaraan ini?
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Nomor Plat:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {activeSession?.vehicle.plate_number}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Total Biaya:</Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2">Pilih Gerbang:</Typography>
              <TextField
                select
                fullWidth
                label="Gerbang Keluar"
                value={selectedGate || ''}
                onChange={(e) => setSelectedGate(Number(e.target.value))}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                {gates.map((gate) => (
                  <MenuItem key={gate.id} value={gate.id}>
                    {gate.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseExitDialog} color="inherit">
              Batal
            </Button>
            <Button 
              onClick={handleProcessExit} 
              variant="contained" 
              color="primary"
              disabled={!selectedGate || processExitMutation.isPending}
              startIcon={processExitMutation.isPending ? <CircularProgress size={20} /> : <SuccessIcon />}
            >
              Konfirmasi
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onClose={handleCloseReceiptDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptIcon sx={{ mr: 1 }} /> 
            Struk Pembayaran
            <IconButton
              onClick={handleCloseReceiptDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1, mb: 3 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Pembayaran Berhasil
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <SuccessIcon color="success" sx={{ fontSize: 64 }} />
              </Box>
              
              {activeSession && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Nomor Plat</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {activeSession.vehicle.plate_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Jenis Kendaraan</Typography>
                    <Typography variant="body1">
                      {activeSession.vehicle.type === 'CAR' ? 'Mobil' : 
                       activeSession.vehicle.type === 'MOTORCYCLE' ? 'Motor' : 
                       activeSession.vehicle.type === 'TRUCK' ? 'Truk' : 
                       activeSession.vehicle.type}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Waktu Masuk</Typography>
                    <Typography variant="body2">
                      {formatDateTime(new Date(activeSession.entry_time))}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Waktu Keluar</Typography>
                    <Typography variant="body2">
                      {formatDateTime(new Date())}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Biaya Parkir</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {formatCurrency(parkingFee)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Pajak (10%)</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" align="right">
                      {formatCurrency(taxAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" fontWeight="bold">Total</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" fontWeight="bold" align="right">
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
            
            <Typography variant="body2" align="center" gutterBottom>
              Silakan membuka gerbang untuk mengizinkan kendaraan keluar
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenGate}
              size="large"
              disabled={!selectedGate}
              sx={{ borderRadius: 8, px: 4 }}
            >
              Buka Gerbang
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </PageWrapper>
  );
};

export default ExitGatePage; 