import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  SelectChangeEvent,
  Avatar,
  Divider,
  Snackbar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import { parkingSessionService, parkingRateService } from '../services/api';
import { ParkingSession, ParkingRate } from '../types';
import { VehicleType } from '../utils/constants';
import LocalBarcodeGenerator from '../components/LocalBarcodeGenerator';

// Memperluas interface ParkingSession untuk tipe dalam komponen ini
interface EnhancedParkingSession extends Omit<ParkingSession, 'vehicle'> {
  vehicle?: {
    id: number;
    plate_number: string;
    type: string;
  };
  vehicleImageUrl?: string;
}

const ParkingSessionsPage = () => {
  const [sessions, setSessions] = useState<EnhancedParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<EnhancedParkingSession | null>(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: '',
    entry_time: '',
    exit_time: '',
    status: '',
    parking_area: '',
  });
  const [parkingRates, setParkingRates] = useState<ParkingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Referensi untuk fungsi print
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Auto-hide success message after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fungsi untuk mencetak tiket parkir individual
  const handlePrintTicket = (session: EnhancedParkingSession) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Mohon izinkan popup untuk mencetak.');
      return;
    }

    const vehicleType = session.vehicle?.type || 'UNKNOWN';
    const rate = getParkingRate(vehicleType);
    const duration = calculateDuration(session.entry_time, session.exit_time);
    const cost = calculateCost(session.entry_time, session.exit_time, vehicleType);

    // Membuat konten HTML untuk dicetak
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tiket Parkir #${session.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              width: 300px;
            }
            .ticket {
              border: 1px solid #ccc;
              padding: 15px;
              margin-bottom: 20px;
            }
            .ticket-header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
            }
            .ticket-info {
              margin-bottom: 15px;
            }
            .ticket-info p {
              margin: 5px 0;
              display: flex;
              justify-content: space-between;
            }
            .ticket-info p span:first-child {
              font-weight: bold;
            }
            .barcode {
              text-align: center;
              margin: 15px 0;
              padding: 10px 0;
              border-top: 1px dashed #ccc;
              border-bottom: 1px dashed #ccc;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
            }
            .ticket-footer {
              text-align: center;
              font-size: 12px;
              margin-top: 15px;
            }
            .no-print {
              display: none;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="ticket-header">
              <h2>TIKET PARKIR</h2>
              <p>${formatDateTime(new Date())}</p>
            </div>
            <div class="ticket-info">
              <p><span>Nomor Tiket:</span> <span>${session.id}</span></p>
              <p><span>Nomor Plat:</span> <span>${session.vehicle?.plate_number || 'N/A'}</span></p>
              <p><span>Jenis Kendaraan:</span> <span>${session.vehicle?.type || 'N/A'}</span></p>
              <p><span>Waktu Masuk:</span> <span>${formatDateTime(session.entry_time)}</span></p>
              ${session.exit_time ? `<p><span>Waktu Keluar:</span> <span>${formatDateTime(session.exit_time)}</span></p>` : ''}
              ${session.exit_time ? `<p><span>Durasi:</span> <span>${duration}</span></p>` : ''}
              <p><span>Tarif per jam:</span> <span>Rp ${rate.hourly_rate ? rate.hourly_rate.toString() : '0'}</span></p>
              ${session.exit_time ? `<p><span>Total Biaya:</span> <span>${cost}</span></p>` : ''}
              <p><span>Status:</span> <span>${session.status}</span></p>
            </div>
            <div class="barcode">
              <svg id="barcode"></svg>
            </div>
            <div class="ticket-footer">
              <p>Terima kasih telah menggunakan layanan parkir kami.</p>
              <p>Simpan tiket ini untuk keluar.</p>
            </div>
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Cetak Tiket
            </button>
            <button onclick="window.close()" style="margin-left: 10px; padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Tutup
            </button>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            // Generate barcode with the ticket ID
            JsBarcode("#barcode", "${session.id}", {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: true
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const fetchParkingRates = async () => {
    try {
      console.log('Fetching parking rates...');
      const rates = await parkingRateService.getAll();
      console.log('Received parking rates:', rates);
      setParkingRates(rates);
    } catch (err) {
      console.error('Error fetching parking rates:', err);
    } finally {
      setRatesLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('DEBUG: Fetching parking sessions from frontend component...');
      
      const data = await parkingSessionService.getAll();
      console.log('DEBUG: Received parking sessions data:', data);
      
      if (!data || !Array.isArray(data)) {
        console.error('DEBUG: Invalid data format:', data);
        setError('Invalid data format received from server');
        setSessions([]);
        return;
      }
      
      // Process and enhance the parking sessions
      const enhancedData = data.map(session => {
        // Ensure vehicle data is properly structured
        const vehicle = (session as any).vehicle || {
          id: session.vehicleId || 0,
          plate_number: session.vehicleId ? `Unknown-${session.vehicleId}` : 'Unknown',
          type: 'Unknown'
        };
        
        // Pilih gambar lokal berdasarkan tipe kendaraan
        let vehicleImagePath = '/assets/images/car-default.jpg';
        
        if (vehicle.type === 'MOTORCYCLE' || vehicle.type === 'MOTOR') {
          vehicleImagePath = '/assets/images/motorcycle.jpg';
        } else if (vehicle.type === 'TRUCK' || vehicle.type === 'TRUK') {
          vehicleImagePath = '/assets/images/truck.jpg';
        } else if (vehicle.type === 'BUS') {
          vehicleImagePath = '/assets/images/bus.jpg';
        } else if (vehicle.type === 'VAN') {
          vehicleImagePath = '/assets/images/van.jpg';
        }
        
        return {
          ...session,
          vehicle,
          // Gunakan asset lokal untuk gambar
          vehicleImageUrl: vehicleImagePath
        } as EnhancedParkingSession;
      });
      
      console.log('DEBUG: Enhanced data:', enhancedData);
      setSessions(enhancedData);
    } catch (err) {
      console.error('DEBUG: Error fetching parking sessions:', err);
      setError(`Failed to load parking sessions: ${(err as Error)?.message || 'Unknown error'}`);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchParkingRates();
  }, []);

  const handleCompleteSession = async (id: number) => {
    try {
      // Reset pesan error dan success
      setError(null);
      setSuccess(null);
      
      // Menandai sesi sebagai COMPLETED dengan menggunakan fungsi update
      await parkingSessionService.update(id, {
        status: 'COMPLETED',
        exit_time: new Date().toISOString()
      });
      
      // Tampilkan notifikasi sukses
      setSuccess(`Sesi parkir #${id} berhasil diselesaikan`);
      
      // Tunggu sebentar untuk memastikan data sudah diperbarui di server
      setTimeout(() => {
        // Refresh list sesi parkir setelah menyelesaikan sesi
        fetchSessions();
        // Menampilkan notifikasi sukses (jika ada)
        console.log('Sesi parkir berhasil diselesaikan');
      }, 1000);
    } catch (err) {
      console.error('Error completing session:', err);
      setError(`Failed to complete parking session: ${(err as Error)?.message || 'Unknown error'}`);
    }
  };

  const handleViewDetails = (session: EnhancedParkingSession) => {
    setSelectedSession(session);
    setOpenDetailsDialog(true);
  };

  const handleEditSession = (session: EnhancedParkingSession) => {
    setSelectedSession(session);
    setFormData({
      license_plate: session.vehicle?.plate_number || '',
      vehicle_type: session.vehicle?.type || '',
      entry_time: session.entry_time ? new Date(session.entry_time).toISOString() : '',
      exit_time: session.exit_time ? new Date(session.exit_time).toISOString() : '',
      status: session.status,
      parking_area: session.parkingArea?.name || '',
    });
    setOpenEditDialog(true);
  };

  const handleDeleteSession = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parking session?')) {
      try {
        // In a real app, use parkingSessionService.delete
        // For now, just remove it from the local state
        setSessions(sessions.filter(session => session.id !== id));
      } catch (err) {
        console.error('Error deleting session:', err);
        setError(`Failed to delete parking session: ${(err as Error)?.message || 'Unknown error'}`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  // Tambahkan handler terpisah untuk Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmitEdit = async () => {
    try {
      if (!selectedSession) return;

      // Mulai proses penyimpanan, aktifkan loading
      setSaveLoading(true);
      setError(null);
      setSuccess(null);

      console.log("Saving changes to session:", selectedSession.id);
      console.log("Form data:", formData);

      // Buat objek untuk data yang akan diupdate
      const updateData = {
        status: formData.status,
        license_plate: formData.license_plate,  // Selalu kirim plate number
        vehicle_type: formData.vehicle_type,    // Selalu kirim vehicle type
      };

      // Tambahkan exit_time jika ada
      if (formData.exit_time) {
        updateData.exit_time = new Date(formData.exit_time).toISOString();
      }

      // Tambahkan parking_area jika berbeda
      if (formData.parking_area !== selectedSession.parkingArea?.name) {
        updateData.parking_area = formData.parking_area;
      }

      console.log("Sending update data:", updateData);

      // Gunakan service untuk update
      const updatedSession = await parkingSessionService.update(selectedSession.id, updateData);
      
      console.log('Update successful:', updatedSession);
      
      // Tampilkan notifikasi sukses
      setSuccess(`Sesi parkir #${selectedSession.id} berhasil diperbarui`);
      
      // Tutup dialog
      setOpenEditDialog(false);
      
      // Refresh data setelah beberapa saat
      setTimeout(() => {
        fetchSessions();
        console.log("Data refreshed after update");
      }, 1000);
    } catch (err) {
      console.error('Error in submit handler:', err);
      setError(`Gagal memperbarui sesi parkir: ${(err as Error)?.message || 'Unknown error'}`);
    } finally {
      // Pastikan loading dinon-aktifkan meski terjadi error
      setSaveLoading(false);
    }
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDateTime = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  // Mengkonversi tipe kendaraan ke format yang dikenali database
  const mapVehicleTypeToDbFormat = (type: string): VehicleType => {
    const typeMap: Record<string, VehicleType> = {
      'MOBIL': VehicleType.MOBIL,
      'MOTOR': VehicleType.MOTOR,
      'TRUK': VehicleType.TRUK,
      'BUS': VehicleType.BUS,
      'VAN': VehicleType.VAN
    };
    
    return typeMap[type] || type as VehicleType;
  };

  // Mendapatkan tarif untuk tipe kendaraan tertentu
  const getParkingRate = (vehicleType: string) => {
    const mappedType = mapVehicleTypeToDbFormat(vehicleType);
    const rate = parkingRates.find(rate => rate.vehicle_type === mappedType);
    
    if (!rate) {
      // Default values if rate not found
      return {
        base_rate: 5000,
        hourly_rate: 2000,
        daily_rate: 20000,
      };
    }
    
    return rate;
  };

  // Perhitungan durasi parkir
  const calculateDuration = (entryTime: string | Date, exitTime?: string | Date) => {
    if (!entryTime) return 'N/A';
    
    const start = new Date(entryTime);
    const end = exitTime ? new Date(exitTime) : new Date();
    
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Perhitungan durasi dalam jam (untuk kalkulasi biaya)
  const calculateDurationInHours = (entryTime: string | Date, exitTime?: string | Date) => {
    if (!entryTime) return 0;
    
    const start = new Date(entryTime);
    const end = exitTime ? new Date(exitTime) : new Date();
    
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.ceil(durationMs / (1000 * 60 * 60));
    
    return hours;
  };

  // Perkiraan biaya parkir berdasarkan tarif di database
  const calculateCost = (entryTime: string | Date, exitTime?: string | Date, vehicleType?: string) => {
    if (!entryTime || !vehicleType) return 'Rp0';
    
    const rate = getParkingRate(vehicleType);
    const hours = calculateDurationInHours(entryTime, exitTime);
    
    // Jika durasi ≤ 1 jam, hanya kenakan tarif dasar
    if (hours <= 1) {
      return `Rp${rate.base_rate.toLocaleString()}`;
    }
    
    // Jika durasi > 1 jam, tambahkan biaya per jam
    const totalCost = rate.base_rate + (hours - 1) * rate.hourly_rate;
    
    // Jika melebihi 24 jam, pertimbangkan tarif harian
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      const dailyCost = days * rate.daily_rate;
      const hourlyAdditional = remainingHours > 0 ? remainingHours * rate.hourly_rate : 0;
      
      return `Rp${(dailyCost + hourlyAdditional).toLocaleString()}`;
    }
    
    return `Rp${totalCost.toLocaleString()}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Parking Sessions</Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={fetchSessions}
          variant="outlined"
        >
          REFRESH
        </Button>
      </Box>

      {/* Tampilkan pesan error jika ada */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Tampilkan pesan sukses jika ada */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }} 
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
      
      {/* Notifikasi Snackbar untuk sukses */}
      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Notifikasi Snackbar untuk error */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Typography variant="body1" paragraph>
        Manage parking sessions in the system.
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" gutterBottom>No parking sessions found.</Typography>
            <Typography color="textSecondary" paragraph>
              There are no parking sessions in the system, or the server might be unavailable.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchSessions}
              startIcon={<RefreshIcon />}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Foto</TableCell>
                  <TableCell>Plat Nomor</TableCell>
                  <TableCell>Jenis Kendaraan</TableCell>
                  <TableCell>Area Parkir</TableCell>
                  <TableCell>Waktu Masuk</TableCell>
                  <TableCell>Waktu Keluar</TableCell>
                  <TableCell>Tiket</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>{session.id}</TableCell>
                    <TableCell>
                      <Avatar
                        alt={`Vehicle ${session.id}`}
                        src={session.vehicleImageUrl}
                        sx={{ width: 56, height: 56 }}
                        variant="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {session.vehicle?.plate_number || 'Unknown'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={session.vehicle?.type || 'Unknown'} 
                        size="small"
                        color={
                          session.vehicle?.type === 'CAR' ? 'primary' : 
                          session.vehicle?.type === 'MOTORCYCLE' ? 'secondary' : 
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {session.parkingArea?.name || 'Default Area'}
                    </TableCell>
                    <TableCell>{formatDateTime(session.entry_time)}</TableCell>
                    <TableCell>{session.exit_time ? formatDateTime(session.exit_time) : '-'}</TableCell>
                    <TableCell>
                      {session.ticket ? `#${session.ticket.id}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        size="small"
                        color={getStatusColor(session.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Lihat Detail">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(session)}
                            color="info"
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {session.status === 'ACTIVE' && (
                          <Tooltip title="Selesaikan Sesi">
                            <IconButton 
                              size="small" 
                              onClick={() => handleCompleteSession(session.id)} 
                              color="success"
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditSession(session)} 
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Print">
                          <IconButton 
                            size="small" 
                            onClick={() => handlePrintTicket(session)} 
                            color="secondary"
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Hapus">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteSession(session.id)} 
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detail Sesi Parkir #{selectedSession?.id}
            </Typography>
            <Box>
              <Tooltip title="Print">
                <IconButton 
                  color="primary" 
                  onClick={() => selectedSession && handlePrintTicket(selectedSession)}
                >
                  <LocalPrintshopIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton color="secondary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <div ref={printComponentRef}>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={selectedSession.vehicleImageUrl}
                        alt="Vehicle"
                      />
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Informasi Kendaraan</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1">Plat Nomor: <strong>{selectedSession.vehicle?.plate_number || 'Unknown'}</strong></Typography>
                        <Typography variant="body1">Jenis: <strong>{selectedSession.vehicle?.type || 'Unknown'}</strong></Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Informasi Sesi Parkir</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1">ID: <strong>{selectedSession.id}</strong></Typography>
                        <Typography variant="body1">Area Parkir: <strong>{selectedSession.parkingArea?.name || 'Default Area'}</strong></Typography>
                        <Typography variant="body1">Nomor Tiket: <strong>{selectedSession.ticket ? `#${selectedSession.ticket.id}` : '-'}</strong></Typography>
                        <Typography variant="body1">Waktu Masuk: <strong>{formatDateTime(selectedSession.entry_time)}</strong></Typography>
                        <Typography variant="body1">Waktu Keluar: <strong>{selectedSession.exit_time ? formatDateTime(selectedSession.exit_time) : 'Belum keluar'}</strong></Typography>
                        <Typography variant="body1">Durasi: <strong>{calculateDuration(selectedSession.entry_time, selectedSession.exit_time)}</strong></Typography>
                        <Typography variant="body1">Waktu Dibuat: <strong>{formatDateTime(selectedSession.created_at)}</strong></Typography>
                        <Typography variant="body1">Terakhir Diperbarui: <strong>{formatDateTime(selectedSession.updated_at)}</strong></Typography>
                        <Typography variant="body1">Status: <strong>
                          <Chip
                            label={selectedSession.status}
                            size="small"
                            color={getStatusColor(selectedSession.status)}
                          />
                        </strong></Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Informasi Biaya</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            {ratesLoading ? (
                              <CircularProgress size={20} />
                            ) : (
                              <>
                                <Typography variant="body1">
                                  Tarif Dasar: <strong>
                                    Rp{getParkingRate(selectedSession.vehicle?.type || '').base_rate.toLocaleString()}
                                  </strong>
                                </Typography>
                                <Typography variant="body1">
                                  Tarif per Jam: <strong>
                                    Rp{getParkingRate(selectedSession.vehicle?.type || '').hourly_rate.toLocaleString()}/jam
                                  </strong>
                                </Typography>
                                <Typography variant="body1">
                                  Tarif Harian: <strong>
                                    Rp{getParkingRate(selectedSession.vehicle?.type || '').daily_rate.toLocaleString()}/hari
                                  </strong>
                                </Typography>
                              </>
                            )}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body1">
                              Total Biaya: <strong>
                                {calculateCost(selectedSession.entry_time, selectedSession.exit_time, selectedSession.vehicle?.type)}
                              </strong>
                            </Typography>
                            <Typography variant="body1">Metode Pembayaran: <strong>Cash</strong></Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Barcode</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                          <LocalBarcodeGenerator 
                            value={selectedSession.vehicle?.plate_number || 'Unknown'} 
                            width={250}
                            height={100}
                          />
                        </Box>
                        <Typography variant="body2" align="center">
                          {selectedSession.vehicle?.plate_number || 'Unknown'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Parking Session</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              label="License Plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              disabled={saveLoading}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleSelectChange}
                label="Vehicle Type"
                disabled={saveLoading}
              >
                <MenuItem value="MOTOR">Motor</MenuItem>
                <MenuItem value="MOBIL">Mobil</MenuItem>
                <MenuItem value="TRUK">Truk</MenuItem>
                <MenuItem value="BUS">Bus</MenuItem>
                <MenuItem value="VAN">Van</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Parking Area</InputLabel>
              <Select
                name="parking_area"
                value={formData.parking_area}
                onChange={handleSelectChange}
                label="Parking Area"
                disabled={saveLoading}
              >
                <MenuItem value="Default Area">Default Area</MenuItem>
                <MenuItem value="Area A">Area A</MenuItem>
                <MenuItem value="Area B">Area B</MenuItem>
                <MenuItem value="Area C">Area C</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Entry Time"
              name="entry_time"
              type="datetime-local"
              value={formData.entry_time ? formData.entry_time.slice(0, 16) : ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={saveLoading}
            />
            <TextField
              label="Exit Time"
              name="exit_time"
              type="datetime-local"
              value={formData.exit_time ? formData.exit_time.slice(0, 16) : ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={saveLoading}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                label="Status"
                disabled={saveLoading}
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={saveLoading}>
            CANCEL
          </Button>
          <Button 
            onClick={handleSubmitEdit} 
            variant="contained" 
            color="primary" 
            disabled={saveLoading}
            startIcon={saveLoading ? <CircularProgress size={20} /> : null}
          >
            {saveLoading ? 'SAVING...' : 'SAVE'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParkingSessionsPage; 