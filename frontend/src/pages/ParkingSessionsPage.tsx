import { useState, useEffect, FC } from 'react';
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
  Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { parkingSessionService } from '../services/api';

const ParkingSessionsPage: FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [formData, setFormData] = useState({
    licensePlate: '',
    vehicleType: '',
    entryTime: '',
    exitTime: '',
    status: ''
  });

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await parkingSessionService.getAll();
      // Add mock image URLs if they don't exist
      const enhancedData = data && Array.isArray(data) ? data.map(session => ({
        ...session,
        vehicleImageUrl: session.vehicleImageUrl || `https://source.unsplash.com/random/300x200?car&sig=${session.id}`,
        barcodeImageUrl: session.barcodeImageUrl || `https://barcodeapi.org/api/code128/${session.licensePlate.replace(/\s/g, '')}`
      })) : [];
      setSessions(enhancedData);
    } catch (err) {
      console.error('Error fetching parking sessions:', err);
      setError('Failed to load parking sessions');
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
      setError('Failed to complete parking session');
    }
  };

  const handleViewDetails = (session: any) => {
    setSelectedSession(session);
    setOpenDetailsDialog(true);
  };

  const handleEditSession = (session: any) => {
    setSelectedSession(session);
    setFormData({
      licensePlate: session.licensePlate,
      vehicleType: session.vehicleType,
      entryTime: new Date(session.entryTime).toISOString().slice(0, 16),
      exitTime: session.exitTime ? new Date(session.exitTime).toISOString().slice(0, 16) : '',
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
        setError('Failed to delete parking session');
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

  const handleSubmitEdit = async () => {
    try {
      // In a real app, use parkingSessionService.update
      const updatedSession = {
        ...selectedSession,
        ...formData
      };
      
      // Update in local state
      setSessions(sessions.map(session => 
        session.id === selectedSession.id ? updatedSession : session
      ));
      
      setOpenEditDialog(false);
    } catch (err) {
      console.error('Error updating session:', err);
      setError('Failed to update parking session');
    }
  };

  const handlePrintTicket = (session: any) => {
    // Create a printable format for the ticket
    const ticketContent = `
      <html>
        <head>
          <title>Parking Ticket</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .ticket { border: 1px solid #ccc; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .barcode { text-align: center; margin: 15px 0; }
            .barcode img { max-width: 100%; height: auto; }
            .info { margin: 5px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">Parking Ticket</div>
            <div class="info"><strong>ID:</strong> ${session.id}</div>
            <div class="info"><strong>License Plate:</strong> ${session.licensePlate}</div>
            <div class="info"><strong>Vehicle Type:</strong> ${session.vehicleType}</div>
            <div class="info"><strong>Entry Time:</strong> ${new Date(session.entryTime).toLocaleString()}</div>
            <div class="barcode">
              <img src="${session.barcodeImageUrl}" alt="Barcode" />
            </div>
            <div class="footer">Please keep this ticket until you exit.</div>
          </div>
        </body>
      </html>
    `;
    
    // Open a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      alert('Please allow popups for this website to print tickets.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '-';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Parking Sessions
        </Typography>
        <Button 
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
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff4f4' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Typography>No parking sessions found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Vehicle Image</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Vehicle Type</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Exit Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.id}</TableCell>
                    <TableCell>
                      <Box
                        component="img"
                        sx={{
                          height: 60,
                          width: 80,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                        alt="Vehicle"
                        src={session.vehicleImageUrl}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        component="img"
                        sx={{
                          height: 40,
                          width: 120,
                          objectFit: 'contain'
                        }}
                        alt="Barcode"
                        src={session.barcodeImageUrl}
                      />
                    </TableCell>
                    <TableCell>{session.licensePlate}</TableCell>
                    <TableCell>{session.vehicleType}</TableCell>
                    <TableCell>{new Date(session.entryTime).toLocaleString()}</TableCell>
                    <TableCell>
                      {session.exitTime ? new Date(session.exitTime).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{formatDuration(session.durationMinutes)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={session.status} 
                        color={getStatusColor(session.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {session.fee ? `Rp ${session.fee.toLocaleString('id-ID')}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewDetails(session)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Print Ticket">
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => handlePrintTicket(session)}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Session">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditSession(session)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Session">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {session.status === 'ACTIVE' && (
                          <Tooltip title="Complete Session">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleCompleteSession(session.id)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
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
        {selectedSession && (
          <>
            <DialogTitle>
              Parking Session Details - {selectedSession.licensePlate}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={selectedSession.vehicleImageUrl}
                      alt="Vehicle Image"
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
                      <Typography><strong>License Plate:</strong> {selectedSession.licensePlate}</Typography>
                      <Typography><strong>Vehicle Type:</strong> {selectedSession.vehicleType}</Typography>
                      <Typography><strong>Status:</strong> {selectedSession.status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Session Information</Typography>
                      <Typography><strong>ID:</strong> {selectedSession.id}</Typography>
                      <Typography><strong>Entry Time:</strong> {new Date(selectedSession.entryTime).toLocaleString()}</Typography>
                      <Typography><strong>Exit Time:</strong> {selectedSession.exitTime ? new Date(selectedSession.exitTime).toLocaleString() : '-'}</Typography>
                      <Typography><strong>Duration:</strong> {formatDuration(selectedSession.durationMinutes)}</Typography>
                      <Typography><strong>Fee:</strong> {selectedSession.fee ? `Rp ${selectedSession.fee.toLocaleString('id-ID')}` : '-'}</Typography>
                      <Typography><strong>Entry Gate:</strong> {selectedSession.entryGateId || '-'}</Typography>
                      <Typography><strong>Exit Gate:</strong> {selectedSession.exitGateId || '-'}</Typography>
                      <Typography><strong>Parking Area:</strong> {selectedSession.parkingAreaId || '-'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Barcode</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Box
                          component="img"
                          sx={{
                            maxHeight: 100,
                            maxWidth: '100%',
                            objectFit: 'contain'
                          }}
                          alt="Barcode"
                          src={selectedSession.barcodeImageUrl}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                startIcon={<PrintIcon />}
                variant="outlined" 
                color="secondary"
                onClick={() => handlePrintTicket(selectedSession)}
              >
                Print Ticket
              </Button>
              <Button 
                startIcon={<EditIcon />}
                variant="outlined" 
                color="primary"
                onClick={() => {
                  setOpenDetailsDialog(false);
                  handleEditSession(selectedSession);
                }}
              >
                Edit Session
              </Button>
              <Button 
                variant="contained"
                onClick={() => setOpenDetailsDialog(false)}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Parking Session
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="License Plate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleInputChange}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
              <Select
                labelId="vehicle-type-label"
                name="vehicleType"
                value={formData.vehicleType}
                label="Vehicle Type"
                onChange={handleInputChange}
              >
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="MOTORCYCLE">Motorcycle</MenuItem>
                <MenuItem value="TRUCK">Truck</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              fullWidth
              label="Entry Time"
              name="entryTime"
              type="datetime-local"
              value={formData.entryTime}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              margin="normal"
              fullWidth
              label="Exit Time"
              name="exitTime"
              type="datetime-local"
              value={formData.exitTime}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleInputChange}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParkingSessionsPage; 