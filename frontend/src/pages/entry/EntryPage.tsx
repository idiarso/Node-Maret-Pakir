import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { PhotoCamera as CameraIcon } from '@mui/icons-material';
import { parkingSessionService, ParkingSessionResponse } from '../../services/api';

const EntryPage: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { mutate: submitEntry, isPending } = useMutation<
    ParkingSessionResponse,
    Error,
    void,
    unknown
  >({
    mutationFn: () => {
      return parkingSessionService.createEntry({
        plate_number: plateNumber,
        type: vehicleType,
        entry_operator_id: 1, // TODO: Get from authenticated user
      });
    },
    onSuccess: () => {
      setPlateNumber('');
      setVehicleType('');
      setPhoto(null);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Tidak dapat mengakses kamera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(photoData);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plateNumber || !vehicleType) {
      setError('Plate number and vehicle type are required');
      return;
    }

    submitEntry();
  };

  const handleVehicleTypeChange = (event: SelectChangeEvent) => {
    setVehicleType(event.target.value);
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Entry Point
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Camera Feed */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kamera
            </Typography>
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: 'black' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<CameraIcon />}
              onClick={capturePhoto}
              fullWidth
              sx={{ mt: 2 }}
            >
              Ambil Foto
            </Button>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </CardContent>
        </Card>

        {/* Entry Form */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Kendaraan
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nomor Plat"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Jenis Kendaraan</InputLabel>
                <Select
                  value={vehicleType}
                  label="Jenis Kendaraan"
                  onChange={handleVehicleTypeChange}
                >
                  <MenuItem value="car">Mobil</MenuItem>
                  <MenuItem value="motorcycle">Motor</MenuItem>
                  <MenuItem value="truck">Truk</MenuItem>
                </Select>
              </FormControl>

              {photo && (
                <Box sx={{ width: '100%', aspectRatio: '16/9', position: 'relative' }}>
                  <img
                    src={photo}
                    alt="Captured"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              )}

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isPending}
                sx={{ mt: 2 }}
              >
                {isPending ? <CircularProgress size={24} /> : 'Simpan'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EntryPage; 