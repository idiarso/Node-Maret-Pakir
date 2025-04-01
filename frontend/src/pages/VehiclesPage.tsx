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
  Avatar,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  DirectionsCar as CarIcon,
  TwoWheeler as MotorcycleIcon,
  LocalShipping as TruckIcon,
  AirportShuttle as VanIcon,
  DirectionsBus as BusIcon,
  TimeToLeave as OtherIcon
} from '@mui/icons-material';
import api from '../services/api';
import { ApiResponse } from '../types';
import { API_BASE_URL, VehicleType } from '../utils/constants';

interface Vehicle {
  id: number;
  licensePlate: string;
  type: VehicleType;
  make: string;
  model: string;
  color: string;
  userId: number;
  ownerName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerPhone?: string;
  ownerEmail?: string;
  notes?: string;
}

interface VehicleFormData {
  plateNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  color: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  notes: string;
  active: boolean;
}

const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [selectedTab, setSelectedTab] = useState<string | VehicleType>('ALL');
  const [selectedType, setSelectedType] = useState<VehicleType | 'ALL'>('ALL');
  const [formData, setFormData] = useState<VehicleFormData>({
    plateNumber: '',
    type: VehicleType.CAR,
    make: '',
    model: '',
    color: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    notes: '',
    active: true
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Vehicle[]>>(`${API_BASE_URL}/vehicles`);
      setVehicles(response.data.data);
      setError(null);
      filterVehicles(response.data.data, selectedTab);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles. Please try again later.');
      // For development purposes, set dummy data when API fails
      const dummyVehicles = [
        {
          id: 1,
          licensePlate: 'ABC123',
          type: 'CAR' as VehicleType,
          make: 'Toyota',
          model: 'Camry',
          color: 'Blue',
          userId: 1,
          ownerName: 'John Doe',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          licensePlate: 'XYZ789',
          type: 'MOTORCYCLE' as VehicleType,
          make: 'Honda',
          model: 'CBR',
          color: 'Red',
          userId: 1,
          ownerName: 'John Doe',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          licensePlate: 'DEF456',
          type: 'TRUCK' as VehicleType,
          make: 'Ford',
          model: 'F-150',
          color: 'Black',
          userId: 2,
          ownerName: 'Jane Smith',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          licensePlate: 'GHI789',
          type: 'VAN' as VehicleType,
          make: 'Mercedes',
          model: 'Sprinter',
          color: 'White',
          userId: 3,
          ownerName: 'Bob Johnson',
          active: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setVehicles(dummyVehicles);
      filterVehicles(dummyVehicles, selectedTab);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = (vehiclesList: Vehicle[], filter: string | VehicleType) => {
    if (!Array.isArray(vehiclesList)) {
      setFilteredVehicles([]);
      return;
    }
    
    if (filter === 'ALL') {
      setFilteredVehicles(vehiclesList);
    } else {
      setFilteredVehicles(vehiclesList.filter(v => v.type === filter));
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles(vehicles, selectedTab);
  }, [selectedTab, vehicles]);

  const handleOpenDialog = (vehicle: Vehicle | null = null) => {
    if (vehicle) {
      setEditVehicle(vehicle);
      setFormData({
        plateNumber: vehicle.licensePlate,
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        ownerName: vehicle.ownerName,
        ownerPhone: vehicle.ownerPhone || '',
        ownerEmail: vehicle.ownerEmail || '',
        notes: vehicle.notes || '',
        active: vehicle.active
      });
    } else {
      setEditVehicle(null);
      setFormData({
        plateNumber: '',
        type: VehicleType.CAR,
        make: '',
        model: '',
        color: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        notes: '',
        active: true
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
      [name]: value
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  const handleSaveVehicle = async () => {
    try {
      if (editVehicle) {
        // Update existing vehicle
        await api.put(`${API_BASE_URL}/vehicles/${editVehicle.id}`, formData);
      } else {
        // Create new vehicle
        await api.post(`${API_BASE_URL}/vehicles`, formData);
      }
      handleCloseDialog();
      fetchVehicles();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      // In a real app, you'd want to show an error message to the user
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await api.delete(`${API_BASE_URL}/vehicles/${id}`);
        fetchVehicles();
      } catch (err) {
        console.error('Error deleting vehicle:', err);
        // In a real app, you'd want to show an error message to the user
      }
    }
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case VehicleType.CAR:
        return <CarIcon />;
      case VehicleType.MOTORCYCLE:
        return <MotorcycleIcon />;
      case VehicleType.TRUCK:
        return <TruckIcon />;
      case VehicleType.BUS:
        return <BusIcon />;
      case VehicleType.OTHER:
      default:
        return <OtherIcon />;
    }
  };

  const getVehicleColor = (color: string) => {
    const commonColors: Record<string, string> = {
      'red': '#ff0000',
      'blue': '#0000ff',
      'green': '#00ff00',
      'yellow': '#ffff00',
      'black': '#000000',
      'white': '#ffffff',
      'silver': '#c0c0c0',
      'gray': '#808080',
      'purple': '#800080',
      'orange': '#ffa500',
      'brown': '#a52a2a'
    };
    
    const lowerColor = color.toLowerCase();
    return commonColors[lowerColor] || '#cccccc'; // Default gray if color not found
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
          Vehicles
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchVehicles}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Add Vehicle
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage and track vehicles registered in the system.
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="ALL" label="All Vehicles" />
          {Object.values(VehicleType).map((type) => (
            <Tab key={type} value={type} label={type} icon={getVehicleIcon(type)} iconPosition="start" />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredVehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getVehicleColor(vehicle.color),
                      color: ['white', 'yellow'].includes(vehicle.color.toLowerCase()) ? 'black' : 'white',
                      mr: 2 
                    }}
                  >
                    {getVehicleIcon(vehicle.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {vehicle.licensePlate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.make} {vehicle.model} ({vehicle.color})
                    </Typography>
                  </Box>
                  {!vehicle.active && (
                    <Chip 
                      label="Inactive" 
                      color="error" 
                      size="small" 
                      sx={{ ml: 'auto' }}
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Owner: {vehicle.ownerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {vehicle.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registered: {new Date(vehicle.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <IconButton size="small" onClick={() => handleOpenDialog(vehicle)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteVehicle(vehicle.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
        {filteredVehicles.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No vehicles found in this category.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Vehicles List
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>License Plate</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Make/Model</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>{vehicle.licensePlate}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getVehicleIcon(vehicle.type)}
                    <Box sx={{ ml: 1 }}>{vehicle.type}</Box>
                  </Box>
                </TableCell>
                <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center' 
                  }}>
                    <Box sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: getVehicleColor(vehicle.color),
                      borderRadius: '50%',
                      mr: 1,
                      border: '1px solid #ccc'
                    }} />
                    {vehicle.color}
                  </Box>
                </TableCell>
                <TableCell>{vehicle.ownerName}</TableCell>
                <TableCell>
                  <Chip 
                    label={vehicle.active ? 'Active' : 'Inactive'} 
                    color={vehicle.active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(vehicle)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteVehicle(vehicle.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredVehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No vehicles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details for the vehicle.
          </DialogContentText>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="plateNumber"
                label="License Plate"
                fullWidth
                value={formData.plateNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="type"
                label="Vehicle Type"
                select
                fullWidth
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                {Object.values(VehicleType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="color"
                label="Color"
                fullWidth
                value={formData.color}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="make"
                label="Make"
                fullWidth
                value={formData.make}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label="Model"
                fullWidth
                value={formData.model}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="ownerName"
                label="Owner Name"
                fullWidth
                value={formData.ownerName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="active"
                label="Status"
                select
                fullWidth
                value={formData.active}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveVehicle} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehiclesPage; 