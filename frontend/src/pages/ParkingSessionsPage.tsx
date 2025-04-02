import React, { useState, useEffect } from 'react';
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
  SelectChangeEvent
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import { parkingSessionService } from '../services/api';
import { ParkingSession } from '../types';

// Memperluas interface ParkingSession untuk tipe dalam komponen ini
interface EnhancedParkingSession extends ParkingSession {
  vehicle?: {
    id: number;
    plate_number: string;
    type: string;
  };
  vehicleImageUrl?: string;
  barcodeImageUrl?: string;
}

const ParkingSessionsPage = () => {
  const [sessions, setSessions] = useState<EnhancedParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<EnhancedParkingSession | null>(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: '',
    entry_time: '',
    exit_time: '',
    status: ''
  });

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
          id: session.vehicle_id || 0,
          plate_number: session.vehicle_id ? `Unknown-${session.vehicle_id}` : 'Unknown',
          type: 'Unknown'
        };
        
        return {
          ...session,
          vehicle,
          // Add UI enhancement properties
          vehicleImageUrl: `https://source.unsplash.com/random/300x200?car&sig=${session.id}`,
          barcodeImageUrl: `https://barcodeapi.org/api/code128/${vehicle.plate_number.replace(/\s/g, '')}`
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
  }, []);

  const handleCompleteSession = async (id: number) => {
    try {
      await parkingSessionService.complete(id);
      // Refresh the list after completion
      fetchSessions();
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
      status: session.status
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

      // In a real app, use parkingSessionService.update
      const updatedSession: EnhancedParkingSession = {
        ...selectedSession,
        status: formData.status,
        // Update properties as needed
        vehicle: selectedSession.vehicle ? {
          ...selectedSession.vehicle,
          plate_number: formData.license_plate,
          type: formData.vehicle_type
        } : undefined
      };
      
      // Update in local state
      setSessions(sessions.map(session => 
        session.id === selectedSession.id ? updatedSession : session
      ));
      
      setOpenEditDialog(false);
    } catch (err) {
      console.error('Error updating session:', err);
      setError(`Failed to update parking session: ${(err as Error)?.message || 'Unknown error'}`);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Parking Sessions
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchSessions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage parking sessions in the system.
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchSessions}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

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
                  <TableCell>Plat Nomor</TableCell>
                  <TableCell>Jenis Kendaraan</TableCell>
                  <TableCell>Waktu Masuk</TableCell>
                  <TableCell>Waktu Keluar</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>{session.id}</TableCell>
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
                    <TableCell>{formatDateTime(session.entry_time)}</TableCell>
                    <TableCell>{session.exit_time ? formatDateTime(session.exit_time) : '-'}</TableCell>
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
        <DialogTitle>Parking Session Details</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={selectedSession.vehicleImageUrl}
                    alt="Vehicle"
                  />
                  <CardContent>
                    <Typography variant="h6">Vehicle Information</Typography>
                    <Typography>License Plate: {selectedSession.vehicle?.plate_number || 'Unknown'}</Typography>
                    <Typography>Type: {selectedSession.vehicle?.type || 'Unknown'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Session Information</Typography>
                    <Typography>ID: {selectedSession.id}</Typography>
                    <Typography>Entry Time: {formatDateTime(selectedSession.entry_time)}</Typography>
                    <Typography>Exit Time: {selectedSession.exit_time ? formatDateTime(selectedSession.exit_time) : 'Not exited yet'}</Typography>
                    <Typography>Status: {selectedSession.status}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
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
          <Box sx={{ mt: 2 }}>
            <TextField
              label="License Plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Vehicle Type"
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Entry Time"
              name="entry_time"
              type="datetime-local"
              value={formData.entry_time ? formData.entry_time.slice(0, 16) : ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
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
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                label="Status"
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitEdit} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParkingSessionsPage; 