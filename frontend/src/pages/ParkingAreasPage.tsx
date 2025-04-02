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
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Snackbar,
  Alert,
  AlertColor
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalParking as ParkingIcon
} from '@mui/icons-material';
import { parkingAreaService, ParkingArea, ParkingAreaFormData } from '../services/api';

const ParkingAreasPage: React.FC = () => {
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editArea, setEditArea] = useState<ParkingArea | null>(null);
  const [formData, setFormData] = useState<ParkingAreaFormData>({
    name: '',
    location: '',
    capacity: 0,
    status: 'active'
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const fetchParkingAreas = async () => {
    setLoading(true);
    try {
      const areas = await parkingAreaService.getAll();
      setParkingAreas(areas);
      setError(null);
      showNotification('Parking areas loaded successfully', 'success');
    } catch (err) {
      console.error('Error in fetchParkingAreas:', err);
      setError(`Failed to load parking areas: ${err instanceof Error ? err.message : String(err)}`);
      showNotification('Failed to load parking areas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingAreas();
  }, []);

  const handleOpenDialog = (area: ParkingArea | null = null) => {
    if (area) {
      setEditArea(area);
      setFormData({
        name: area.name,
        location: area.location,
        capacity: area.capacity,
        status: area.status
      });
    } else {
      setEditArea(null);
      setFormData({
        name: '',
        location: '',
        capacity: 0,
        status: 'active'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    });
  };

  const showNotification = (message: string, severity: AlertColor) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const handleSaveParkingArea = async () => {
    try {
      if (editArea) {
        // Update existing parking area
        console.log('Updating parking area with data:', formData);
        const updatedArea = await parkingAreaService.update(editArea.id, formData);
        
        // Update the UI
        const updatedAreas = parkingAreas.map(area => 
          area.id === editArea.id ? updatedArea : area
        );
        setParkingAreas(updatedAreas);
        showNotification('Parking area updated successfully', 'success');
      } else {
        // Create new parking area
        console.log('Creating new parking area with data:', formData);
        const newArea = await parkingAreaService.create(formData);
        
        // Update the UI
        setParkingAreas([...parkingAreas, newArea]);
        showNotification('Parking area created successfully', 'success');
      }
      handleCloseDialog();
    } catch (err: any) {
      // Check for special optimistic UI update errors
      if (err.fallbackData && err.isServerError) {
        console.log('Handling optimistic UI update with fallback data', err.fallbackData);
        
        if (editArea) {
          // Update UI optimistically for edits
          const updatedAreas = parkingAreas.map(area => 
            area.id === editArea.id ? err.fallbackData : area
          );
          setParkingAreas(updatedAreas);
        } else {
          // Update UI optimistically for creates
          setParkingAreas([...parkingAreas, err.fallbackData]);
        }
        
        handleCloseDialog();
        showNotification('Changes saved locally only. Server error occurred.', 'warning');
        return;
      }
      
      // Handle regular errors
      console.error('Error saving parking area:', err);
      showNotification(`Error saving parking area: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteParkingArea = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parking area?')) {
      try {
        console.log('Deleting parking area with ID:', id);
        const success = await parkingAreaService.delete(id);
        
        // Always update UI if the service returns success (even if it's optimistic)
        if (success) {
          const filteredAreas = parkingAreas.filter(area => area.id !== id);
          setParkingAreas(filteredAreas);
          showNotification('Parking area deleted successfully', 'success');
        }
      } catch (err: any) {
        if (err.uiDeleteSuccess) {
          // If the service signals a UI-only delete, update the UI anyway
          const filteredAreas = parkingAreas.filter(area => area.id !== id);
          setParkingAreas(filteredAreas);
          showNotification('Deleted from UI only. Server error occurred.', 'warning');
          return;
        }
        
        console.error('Error in delete operation:', err);
        showNotification(`Error deleting parking area: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) {
      return 'default';
    }
    
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Ensure parkingAreas is never undefined
  const safeAreas = Array.isArray(parkingAreas) ? parkingAreas : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Parking Areas
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchParkingAreas}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Parking Area
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage and monitor parking areas in your facility.
      </Typography>

      {/* Debug information for development */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', display: process.env.NODE_ENV === 'production' ? 'none' : 'block' }}>
        <Typography variant="h6">Debug Info</Typography>
        <Typography variant="body2">API URL: {process.env.REACT_APP_API_BASE_URL}/api/parking-areas</Typography>
        <Typography variant="body2">Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</Typography>
        <Typography variant="body2">Areas array length: {parkingAreas.length}</Typography>
        <Typography variant="body2">Data: {JSON.stringify(parkingAreas).slice(0, 200)}</Typography>
        <Box mt={1}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => {
              const testData = [
                {
                  id: 999,
                  name: 'Test Area',
                  location: 'Test Location',
                  capacity: 100,
                  occupied: 0,
                  status: 'active',
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ];
              setParkingAreas(testData);
            }}
            sx={{ mr: 1 }}
          >
            Add Test Data
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={fetchParkingAreas}
            sx={{ mr: 1 }}
          >
            Test All Endpoints
          </Button>
        </Box>
      </Paper>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {safeAreas.map((area) => (
          <Grid item xs={12} md={4} key={area.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {area?.name || 'Unnamed Area'}
                  </Typography>
                  <Chip 
                    label={area?.status || 'UNKNOWN'} 
                    color={getStatusColor(area?.status) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {area?.location || 'Unknown location'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Capacity
                    </Typography>
                    <Typography variant="h6">
                      {area?.capacity || 0} spots
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Available Spots
                    </Typography>
                    <Typography variant="h6" color={(area?.capacity - (area?.occupied || 0) === 0) ? 'error.main' : 'success.main'}>
                      {area?.capacity - (area?.occupied || 0)} spots
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Occupancy: {Math.round((area?.occupied || 0) / (area?.capacity || 1) * 100)}%
                  </Typography>
                  <Box 
                    sx={{ 
                      mt: 1, 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'grey.200', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${Math.round((area?.occupied || 0) / (area?.capacity || 1) * 100)}%`, 
                        height: '100%', 
                        bgcolor: (area?.capacity - (area?.occupied || 0) === 0) ? 'error.main' : 'primary.main'
                      }} 
                    />
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(area)}
                >
                  Edit
                </Button>
                <Button 
                  size="small" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteParkingArea(area.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Parking Areas List
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Available</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeAreas.map((area) => (
              <TableRow key={area?.id || Math.random()}>
                <TableCell>{area?.id}</TableCell>
                <TableCell>{area?.name || 'Unnamed Area'}</TableCell>
                <TableCell>{area?.location || 'Unknown location'}</TableCell>
                <TableCell>{area?.capacity || 0}</TableCell>
                <TableCell>{(area?.capacity || 0) - (area?.occupied || 0)}</TableCell>
                <TableCell>
                  <Chip 
                    label={area?.status || 'UNKNOWN'} 
                    color={getStatusColor(area?.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(area)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteParkingArea(area?.id || 0)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {safeAreas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No parking areas found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Parking Area Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editArea ? 'Edit Parking Area' : 'Add New Parking Area'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details for the parking area.
          </DialogContentText>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Parking Area Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="location"
                label="Location"
                fullWidth
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="capacity"
                label="Capacity (spots)"
                type="number"
                fullWidth
                value={formData.capacity}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="status"
                label="Status"
                select
                fullWidth
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveParkingArea} variant="contained" color="primary">
            {editArea ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParkingAreasPage; 