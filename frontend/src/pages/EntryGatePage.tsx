import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Camera as CameraIcon,
  Print as PrintIcon,
  DirectionsCar as CarIcon,
  Clear as ClearIcon,
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { parkingSessionService } from '../services/api';
import gateService from '../services/gateService';
import PageWrapper from '../components/PageWrapper';
import Webcam from 'react-webcam';
import { useAuth } from '../contexts/AuthContext';
import WebcamCapture from '../components/WebcamCapture';

// Camera configuration for Dahua IP camera
const DAHUA_CAMERA_CONFIG = {
  rtspUrl: 'rtsp://admin:@dminparkir@192.168.2.20/cam/realmonitor?channel=1&subtype=0',
  username: 'admin',
  password: '@dminparkir',
  ip: '192.168.2.20'
};

const EntryGatePage: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const { user } = useAuth();
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ticketPrinted, setTicketPrinted] = useState(false);
  const [selectedGate, setSelectedGate] = useState<string>('');
  const [isCameraConnected, setIsCameraConnected] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [isPushButtonPressed, setIsPushButtonPressed] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [gates, setGates] = useState<any[]>([]);
  const [gatesLoading, setGatesLoading] = useState(true);

  // Get all gates
  const { data: gatesData } = useQuery({
    queryKey: ['entry-gates'],
    queryFn: async () => {
      const allGates = await gateService.getAll();
      return allGates.filter(gate => gate.type === 'ENTRY');
    }
  });

  // Mutation for creating a parking session
  const submitEntry = useMutation({
    mutationFn: async (data: {
      plate_number: string;
      type: string;
      photo_data?: string;
      gate_id?: number;
    }) => {
      return parkingSessionService.createEntry(data);
    },
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Entry recorded successfully! Printing ticket...',
        severity: 'success'
      });
      setTicketPrinted(true);
      
      // Print ticket via EcoPOS printer
      printTicketToEcoPOS();
      
      // If a gate is selected, try to open it
      if (selectedGate) {
        openGateMutation.mutate(selectedGate);
      }
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to record entry'}`,
        severity: 'error'
      });
    }
  });

  // Mutation for opening gate
  const openGateMutation = useMutation({
    mutationFn: (gateId: string) => gateService.changeStatus(parseInt(gateId), 'OPEN'),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Gate opened successfully',
        severity: 'success'
      });
    },
    onError: (error) => {
      console.error('Error opening gate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to open gate',
        severity: 'error'
      });
    }
  });

  // Simulate push button listener
  useEffect(() => {
    // In a real implementation, this would connect to an actual hardware push button
    // For this demo, we're simulating with keyboard events
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        console.log('Push button pressed (simulated with spacebar)');
        setIsPushButtonPressed(true);
        
        // Auto-capture photo on push button press if camera is connected
        if (isCameraConnected && !emergencyMode) {
          capturePhoto();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Attempt to connect to the Dahua camera
    checkCameraConnection();
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isCameraConnected, emergencyMode]);

  // Check if camera is connected
  const checkCameraConnection = async () => {
    try {
      // In a real implementation, this would make an actual connection test to the IP camera
      // For this demo, we're simulating a connection test
      await fetch(`http://${DAHUA_CAMERA_CONFIG.ip}`, { 
        method: 'HEAD',
        // This would fail in browser due to CORS, but in an Electron app it would work
        // This is just for demonstration
        mode: 'no-cors' 
      }).catch(() => {
        throw new Error('Camera connection failed');
      });
      
      setIsCameraConnected(true);
      setSnackbar({
        open: true,
        message: 'Camera connected successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Camera connection error:', err);
      setIsCameraConnected(false);
      setSnackbar({
        open: true,
        message: 'Failed to connect to camera. Emergency mode enabled.',
        severity: 'error'
      });
      setEmergencyMode(true);
    }
  };

  // Print ticket to EcoPOS printer
  const printTicketToEcoPOS = () => {
    // In a real implementation, this would send data to the EcoPOS printer
    // For this demo, we're just logging the action
    console.log('Printing ticket to EcoPOS printer...');
    console.log('Ticket data:', {
      plateNumber,
      vehicleType,
      entryTime: new Date().toISOString(),
      operatorId: user?.id,
      ticketId: submitEntry.data?.id
    });
    
    // Here we would use a printer library to send commands to the EcoPOS printer
    // Example: send ESC/POS commands for printing text, barcodes, etc.
  };

  const capturePhoto = () => {
    if (emergencyMode) {
      // In emergency mode, we don't need a photo
      setSnackbar({
        open: true,
        message: 'Operating in emergency mode - no photo required',
        severity: 'info'
      });
      return;
    }
    
    if (isCameraConnected && webcamRef.current) {
      // For demo purposes, we're using the webcam component
      // In a real implementation, we would capture from the IP camera
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      
      // In a real implementation, this would be where we capture from the Dahua camera:
      // const captureUrl = `http://${DAHUA_CAMERA_CONFIG.ip}/cgi-bin/snapshot.cgi?channel=1`;
      // Fetch with authentication and handle the image response
    } else {
      setSnackbar({
        open: true,
        message: 'Camera not available. Please enable emergency mode.',
        severity: 'info'
      });
    }
  };

  const handleClearPhoto = () => {
    setPhoto(null);
  };

  const handleSubmit = () => {
    setError(null);
    
    // Validation
    if (!plateNumber) {
      setError('Please enter a license plate number');
      return;
    }
    
    if (!vehicleType) {
      setError('Please select a vehicle type');
      return;
    }
    
    if (!emergencyMode && !selectedGate) {
      setError('Please select an entry gate');
      return;
    }

    // Submit entry data
    submitEntry.mutate({
      plate_number: plateNumber,
      type: vehicleType,
      photo_data: photo || undefined,
      gate_id: selectedGate ? parseInt(selectedGate) : undefined
    });
  };

  const handleReset = () => {
    setPlateNumber('');
    setVehicleType('CAR');
    setPhoto(null);
    setTicketPrinted(false);
    setError(null);
    setIsPushButtonPressed(false);
  };

  const toggleEmergencyMode = () => {
    setEmergencyMode(!emergencyMode);
    if (!emergencyMode) {
      setSnackbar({
        open: true,
        message: 'Emergency mode enabled - manual entry without camera',
        severity: 'info'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Emergency mode disabled',
        severity: 'info'
      });
    }
  };

  // Ambil daftar gate saat komponen dimuat
  useEffect(() => {
    fetchGates();
  }, []);

  // Fungsi untuk mengambil daftar gate dari API
  const fetchGates = async () => {
    setGatesLoading(true);
    try {
      console.log('EntryGatePage: Fetching gates...');
      const gatesList = await gateService.getAll();
      console.log('EntryGatePage: Gates fetched:', gatesList);
      
      if (gatesList.length === 0) {
        console.log('EntryGatePage: No gates found or error fetching gates');
        setError('Tidak ada gate entry yang tersedia. Silakan buat gate terlebih dahulu di menu Gate Management.');
        setGates([]);
      } else {
        // Filter hanya gate ENTRY
        const entryGates = gatesList.filter(gate => 
          gate.type === 'ENTRY' && gate.status === 'ACTIVE'
        );
        
        console.log('EntryGatePage: Filtered entry gates:', entryGates);
        
        if (entryGates.length === 0) {
          setError('Tidak ada gate ENTRY yang aktif. Silakan aktifkan gate di menu Gate Management.');
        } else {
          setError(null);
        }
        
        setGates(entryGates);
        
        // Atur gate default jika ada
        if (entryGates.length > 0) {
          setSelectedGate(entryGates[0].id.toString());
          console.log('EntryGatePage: Set default gate:', entryGates[0].id.toString());
        } else {
          setSelectedGate('');
        }
      }
    } catch (err) {
      console.error('EntryGatePage: Error fetching gates:', err);
      setError('Gagal memuat daftar gate. Silakan refresh halaman atau periksa koneksi server.');
      setGates([]);
    } finally {
      setGatesLoading(false);
    }
  };

  return (
    <PageWrapper title="Entry Gate">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Entry Gate
        </Typography>
        
        {/* Camera status indicator and emergency mode toggle */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: isCameraConnected ? 'success.main' : 'error.main',
                  mr: 1
                }}
              />
              <Typography>
                {isCameraConnected 
                  ? 'Camera Connected - RTSP://192.168.2.20' 
                  : 'Camera Disconnected'}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch 
                  checked={emergencyMode} 
                  onChange={toggleEmergencyMode} 
                  color="warning"
                />
              }
              label="Emergency Mode (No Camera)"
            />
          </Box>
          {isPushButtonPressed && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Push button triggered! {isCameraConnected ? 'Capturing photo...' : 'Please enter details manually.'}
            </Alert>
          )}
        </Card>

        <Grid container spacing={3}>
          {/* Left side - Camera */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vehicle Camera {emergencyMode && '(Disabled in Emergency Mode)'}
                </Typography>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    position: 'relative', 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    bgcolor: emergencyMode ? 'grey.200' : 'inherit'
                  }}
                >
                  {emergencyMode ? (
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <ErrorIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                      <Typography>Camera disabled in emergency mode</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manual entry mode active
                      </Typography>
                    </Box>
                  ) : photo ? (
                    <Box component="img" src={photo} alt="Captured" sx={{ maxWidth: '100%', maxHeight: '100%' }} />
                  ) : (
                    <WebcamCapture
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: 'environment'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </Paper>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  {!emergencyMode && (
                    photo ? (
                      <Button 
                        variant="contained" 
                        color="secondary" 
                        startIcon={<ClearIcon />}
                        onClick={handleClearPhoto}
                      >
                        Clear Photo
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<CameraIcon />} 
                        onClick={capturePhoto}
                      >
                        Capture Photo
                      </Button>
                    )
                  )}
                  
                  {/* Push button simulator for testing */}
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={() => {
                      setIsPushButtonPressed(true);
                      setSnackbar({
                        open: true,
                        message: "Push button triggered! Please enter details manually.",
                        severity: "info"
                      });
                    }}
                    id="simulatePushButton"
                    sx={{ mt: 2, mb: 2, height: '60px' }}
                  >
                    SIMULATE PUSH BUTTON
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right side - Vehicle Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vehicle Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <TextField
                    label="License Plate"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                    fullWidth
                    required
                    placeholder="e.g. AB123CD"
                    InputProps={{
                      startAdornment: <CarIcon sx={{ mr: 1 }} />
                    }}
                  />
                  <FormControl fullWidth required>
                    <InputLabel>Vehicle Type</InputLabel>
                    <Select
                      value={vehicleType}
                      label="Vehicle Type"
                      onChange={(e) => setVehicleType(e.target.value)}
                    >
                      <MenuItem value="MOBIL">Mobil</MenuItem>
                      <MenuItem value="MOTOR">Motor</MenuItem>
                      <MenuItem value="TRUK">Truk</MenuItem>
                      <MenuItem value="BUS">Bus</MenuItem>
                      <MenuItem value="VAN">Van</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal">
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <InputLabel id="gate-select-label">Select Gate</InputLabel>
                      <Box sx={{ ml: 'auto' }}>
                        <Tooltip title="Refresh Gates List">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.preventDefault();
                              fetchGates();
                            }}
                            color="primary"
                            disabled={gatesLoading}
                          >
                            {gatesLoading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Select
                      labelId="gate-select-label"
                      value={selectedGate}
                      label="Select Gate"
                      onChange={(e) => setSelectedGate(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {gatesLoading ? (
                        <MenuItem disabled>Loading gates...</MenuItem>
                      ) : gates.length === 0 ? (
                        <MenuItem disabled>No gates available</MenuItem>
                      ) : (
                        gates.map((gate) => (
                          <MenuItem key={gate.id} value={gate.id.toString()}>
                            {gate.name} - {gate.location}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={handleSubmit}
                  disabled={
                    submitEntry.isPending || 
                    !plateNumber || 
                    !vehicleType || 
                    (!photo && !emergencyMode)
                  }
                >
                  {submitEntry.isPending ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Processing...
                    </>
                  ) : ticketPrinted ? (
                    'Print Again'
                  ) : (
                    'Print Ticket'
                  )}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Ticket Preview */}
        {ticketPrinted && submitEntry.data && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ticket Preview
              </Typography>
              <Paper elevation={3} sx={{ p: 3, border: '1px dashed #ccc' }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h5">Parking Ticket</Typography>
                  <Typography variant="body2">
                    {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Ticket No:</strong> {submitEntry.data.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Plate Number:</strong> {plateNumber}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Vehicle Type:</strong> {vehicleType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Entry Time:</strong> {new Date().toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Operator:</strong> {user?.fullName || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Gate:</strong> {gates?.find(g => g.id === selectedGate)?.name || 'Main Gate'}
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ textAlign: 'center', mt: 3, mb: 1 }}>
                  <svg
                    width="200"
                    height="50"
                    viewBox="0 0 200 50"
                    style={{ margin: '0 auto', display: 'block' }}
                  >
                    {/* Simple barcode representation */}
                    {Array.from({ length: 30 }).map((_, i) => (
                      <rect
                        key={i}
                        x={i * 6}
                        y={5}
                        width={Math.random() > 0.5 ? 3 : 2}
                        height={40}
                        fill="black"
                      />
                    ))}
                  </svg>
                  <Typography variant="body2">{submitEntry.data.id}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Please keep this ticket until exit
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', p: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
              >
                Print Ticket
              </Button>
            </CardActions>
          </Card>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageWrapper>
  );
};

export default EntryGatePage; 