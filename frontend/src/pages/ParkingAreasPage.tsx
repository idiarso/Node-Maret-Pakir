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
  Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalParking as ParkingIcon
} from '@mui/icons-material';
import api from '../services/api';
import { ApiResponse } from '../types';
import { API_BASE_URL } from '../utils/constants';

interface ParkingArea {
  id: number;
  name: string;
  location: string;
  capacity: number;
  availableSpots: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

interface ParkingAreaFormData {
  name: string;
  location: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

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
    status: 'ACTIVE'
  });

  const fetchParkingAreas = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<ParkingArea[]>>(`${API_BASE_URL}/parking-areas`);
      setParkingAreas(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching parking areas:', err);
      setError('Failed to load parking areas. Please try again later.');
      // For development purposes, set dummy data when API fails
      setParkingAreas([
        {
          id: 1,
          name: 'Main Parking Lot',
          location: 'North Building',
          capacity: 200,
          availableSpots: 45,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'VIP Parking',
          location: 'East Wing',
          capacity: 50,
          availableSpots: 12,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'Rooftop Parking',
          location: 'Building B',
          capacity: 100,
          availableSpots: 0,
          status: 'MAINTENANCE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
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
        status: 'ACTIVE'
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

  const handleSaveParkingArea = async () => {
    try {
      if (editArea) {
        // Update existing parking area
        await api.put(`${API_BASE_URL}/parking-areas/${editArea.id}`, formData);
      } else {
        // Create new parking area
        await api.post(`${API_BASE_URL}/parking-areas`, formData);
      }
      handleCloseDialog();
      fetchParkingAreas();
    } catch (err) {
      console.error('Error saving parking area:', err);
      // In a real app, you'd want to show an error message to the user
    }
  };

  const handleDeleteParkingArea = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parking area?')) {
      try {
        await api.delete(`${API_BASE_URL}/parking-areas/${id}`);
        fetchParkingAreas();
      } catch (err) {
        console.error('Error deleting parking area:', err);
        // In a real app, you'd want to show an error message to the user
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'MAINTENANCE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCapacityUsagePercent = (area: ParkingArea) => {
    const usedSpots = area.capacity - area.availableSpots;
    return Math.round((usedSpots / area.capacity) * 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

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

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {parkingAreas.map((area) => (
          <Grid item xs={12} md={4} key={area.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {area.name}
                  </Typography>
                  <Chip 
                    label={area.status} 
                    color={getStatusColor(area.status) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {area.location}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Capacity
                    </Typography>
                    <Typography variant="h6">
                      {area.capacity} spots
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Available Spots
                    </Typography>
                    <Typography variant="h6" color={area.availableSpots === 0 ? 'error.main' : 'success.main'}>
                      {area.availableSpots} spots
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Occupancy: {getCapacityUsagePercent(area)}%
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
                        width: `${getCapacityUsagePercent(area)}%`, 
                        height: '100%', 
                        bgcolor: area.availableSpots === 0 ? 'error.main' : 'primary.main'
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
            {parkingAreas.map((area) => (
              <TableRow key={area.id}>
                <TableCell>{area.id}</TableCell>
                <TableCell>{area.name}</TableCell>
                <TableCell>{area.location}</TableCell>
                <TableCell>{area.capacity}</TableCell>
                <TableCell>{area.availableSpots}</TableCell>
                <TableCell>
                  <Chip 
                    label={area.status} 
                    color={getStatusColor(area.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(area)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteParkingArea(area.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {parkingAreas.length === 0 && (
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
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveParkingArea} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParkingAreasPage; 