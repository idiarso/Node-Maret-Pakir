import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import parkingSessionService from '../services/api/parkingSessionService';
import { formatDateTime, formatCurrency } from '../utils/format';

interface Vehicle {
  id: number;
  plate_number: string;
  type: VehicleType;
}

type VehicleType = 'MOTOR' | 'MOBIL';

interface ParkingSession {
  id: number;
  vehicle: Vehicle;
  entry_time: string;
  exit_time?: string;
  status: 'ACTIVE' | 'EXITED';
}

interface PrintData {
  plateNumber: string;
  vehicleType: 'MOTOR' | 'MOBIL';
  entryTime: string;
  exitTime: string;
  duration: number;
  totalAmount: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const VEHICLE_RATES = {
  MOTOR: { base: 2000, hourly: 1000 },
  MOBIL: { base: 5000, hourly: 2000 }
} as const;

const ExitGatePage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const calculateParkingDuration = (entryTime: Date, exitTime: Date): number => {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    return Math.ceil(durationMs / (1000 * 60 * 60)); // Duration in hours, rounded up
  };

  const calculateParkingFee = (vehicleType: VehicleType, durationHours: number): number => {
    const rates = VEHICLE_RATES[vehicleType];
    if (durationHours <= 1) {
      return rates.base;
    }
    return rates.base + (rates.hourly * (durationHours - 1));
  };

  const processExit = async (session: ParkingSession, fee: number) => {
    try {
      // Send command to Arduino to open gate
      await parkingSessionService.sendCommand(1, 'OPEN'); // Assuming gate ID 1 for exit

      // Process exit
      await parkingSessionService.processExit({
        session_id: session.id,
        exit_time: new Date().toISOString(),
        parking_fee: fee
      });

      // Print exit ticket
      await parkingSessionService.printExitTicket(session.id);

      // Capture exit photo
      await parkingSessionService.captureExitPhoto(session.id);

      setSnackbar({
        open: true,
        message: 'Berhasil memproses keluar',
        severity: 'success'
      });

      // Reset form
      setActiveSession(null);
      setSearchValue('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error processing exit:', error);
      setSnackbar({
        open: true,
        message: 'Gagal memproses keluar: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  const handleVehicleTypeChange = async (event: SelectChangeEvent) => {
    if (!activeSession) return;

    const newType = event.target.value as VehicleType;
    if (newType !== 'MOTOR' && newType !== 'MOBIL') return;

    try {
      const updatedVehicle: Vehicle = {
        ...activeSession.vehicle,
        type: newType
      };

      const updatedSession = await parkingSessionService.update(activeSession.id, {
        vehicle: updatedVehicle
      });
      
      setActiveSession(updatedSession);
      
      const duration = calculateParkingDuration(new Date(updatedSession.entry_time), new Date());
      const fee = calculateParkingFee(updatedSession.vehicle.type, duration);
      await processExit(updatedSession, fee);
    } catch (error) {
      console.error('Error updating vehicle type:', error);
      setSnackbar({
        open: true,
        message: 'Gagal mengubah tipe kendaraan: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  const handleSearch = async (value: string) => {
    if (!value.trim()) return;

    try {
      setLoading(true);
      const response = await parkingSessionService.getSession(value.trim());
      
      if (!response) {
        setSnackbar({
          open: true,
          message: 'Tiket tidak ditemukan',
          severity: 'error'
        });
        return;
      }

      if (response.status === 'EXITED') {
        setSnackbar({
          open: true,
          message: 'Tiket ini sudah digunakan untuk keluar',
          severity: 'error'
        });
        return;
      }

      setActiveSession(response);
      
      // Calculate fee
      const duration = calculateParkingDuration(new Date(response.entry_time), new Date());
      const fee = calculateParkingFee(response.vehicle.type, duration);
      
      // Process exit
      await processExit(response, fee);
    } catch (error) {
      console.error('Error searching:', error);
      let errorMessage = 'Gagal mencari tiket';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Sesi anda telah berakhir. Silakan login kembali.';
          // Redirect to login page
          window.location.href = '/login';
        } else {
          errorMessage += ': ' + (error.response?.data?.message || error.message);
        }
      } else if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSearchValue('');  // Reset input
      if (inputRef.current) {
        inputRef.current.focus();  // Return focus to input
      }
    }
  };

  return (
    <Box p={3}>
      {/* Search Input */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <DirectionsCarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Scan Tiket
          </Typography>
          
          <TextField
            fullWidth
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchValue);
              }
            }}
            placeholder="Scan atau masukkan nomor tiket"
            disabled={loading}
            inputRef={inputRef}
            autoFocus
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleSearch(searchValue)}
                    disabled={!searchValue || loading}
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Vehicle Details */}
      {activeSession && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informasi Kendaraan
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipe Kendaraan</InputLabel>
              <Select
                value={activeSession.vehicle.type}
                onChange={handleVehicleTypeChange}
                label="Tipe Kendaraan"
              >
                <MenuItem value="MOTOR">Motor</MenuItem>
                <MenuItem value="MOBIL">Mobil</MenuItem>
              </Select>
            </FormControl>

            <Typography sx={{ mb: 1 }}>
              <strong>Plat Nomor:</strong> {activeSession.vehicle.plate_number}
            </Typography>

            <Typography sx={{ mb: 1 }}>
              <strong>Waktu Masuk:</strong> {formatDateTime(new Date(activeSession.entry_time))}
            </Typography>

            <Typography sx={{ mb: 1 }}>
              <strong>Durasi:</strong> {calculateParkingDuration(new Date(activeSession.entry_time), new Date())} jam
            </Typography>

            <Typography variant="h6">
              <strong>Total:</strong> {formatCurrency(calculateParkingFee(
                activeSession.vehicle.type,
                calculateParkingDuration(new Date(activeSession.entry_time), new Date())
              ))}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress />
        </Box>
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
  );
};

export default ExitGatePage; 