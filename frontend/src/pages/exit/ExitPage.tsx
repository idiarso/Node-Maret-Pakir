import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface VehicleDetails {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  photo: string;
  parkingFee: number;
  duration: number;
}

interface PaymentDetails {
  plateNumber: string;
  exitTime: string;
  parkingFee: number;
  duration: number;
}

interface PaymentResponse {
  success: boolean;
  message: string;
}

const ExitPage = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const {
    data: vehicleDetails,
    isLoading: isLoadingVehicle,
    refetch: refetchVehicle,
  } = useQuery<VehicleDetails | null>({
    queryKey: ['vehicleDetails', plateNumber],
    queryFn: async () => {
      if (!plateNumber) return null;

      const response = await fetch(`/api/vehicle/${plateNumber}`);
      if (!response.ok) {
        throw new Error('Kendaraan tidak ditemukan');
      }
      return response.json();
    },
    enabled: false,
  });

  const { mutate: processPayment, isPending: isProcessing } = useMutation<PaymentResponse, Error, PaymentDetails>({
    mutationFn: async (payment) => {
      const response = await fetch('/api/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        throw new Error('Gagal memproses pembayaran');
      }

      return response.json();
    },
    onSuccess: () => {
      setPlateNumber('');
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber) {
      setError('Masukkan nomor plat kendaraan');
      return;
    }
    refetchVehicle();
  };

  const handlePayment = () => {
    if (!vehicleDetails) return;

    processPayment({
      plateNumber: vehicleDetails.plateNumber,
      exitTime: new Date().toISOString(),
      parkingFee: vehicleDetails.parkingFee,
      duration: vehicleDetails.duration,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} jam ${remainingMinutes} menit`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exit Point
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Search Form */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cari Kendaraan
            </Typography>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nomor Plat"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                fullWidth
                required
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isLoadingVehicle}
                sx={{ minWidth: 120 }}
              >
                {isLoadingVehicle ? <CircularProgress size={24} /> : 'Cari'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        {vehicleDetails && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detail Kendaraan
              </Typography>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Nomor Plat"
                    secondary={vehicleDetails.plateNumber}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Jenis Kendaraan"
                    secondary={
                      vehicleDetails.vehicleType === 'car' ? 'Mobil' :
                      vehicleDetails.vehicleType === 'motorcycle' ? 'Motor' :
                      vehicleDetails.vehicleType === 'truck' ? 'Truk' :
                      vehicleDetails.vehicleType
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Waktu Masuk"
                    secondary={format(new Date(vehicleDetails.entryTime), 'dd MMMM yyyy HH:mm', { locale: id })}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Durasi Parkir"
                    secondary={formatDuration(vehicleDetails.duration)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Biaya Parkir"
                    secondary={`Rp ${vehicleDetails.parkingFee.toLocaleString('id-ID')}`}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <img
                  src={vehicleDetails.photo}
                  alt="Vehicle"
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                />
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handlePayment}
                disabled={isProcessing}
                sx={{ mt: 3 }}
              >
                {isProcessing ? <CircularProgress size={24} /> : 'Proses Pembayaran'}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ExitPage; 