import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Box
} from '@mui/material';
import { parkingAreaService, ParkingArea } from '../services/parkingAreaService';

interface ParkingAreaFormData {
  name: string;
  location: string;
  capacity: number;
}

export default function ParkingAreasPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ParkingAreaFormData>({
    name: '',
    location: '',
    capacity: 0
  });

  const { data: parkingAreas = [], isLoading, error } = useQuery<ParkingArea[]>({
    queryKey: ['parkingAreas'],
    queryFn: parkingAreaService.getAll
  });

  const createMutation = useMutation({
    mutationFn: parkingAreaService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAreas'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ParkingAreaFormData }) =>
      parkingAreaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAreas'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: parkingAreaService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkingAreas'] });
    }
  });

  const handleOpenDialog = (parkingArea?: ParkingArea) => {
    if (parkingArea) {
      setIsEditing(true);
      setSelectedId(parkingArea.id);
      setFormData({
        name: parkingArea.name,
        location: parkingArea.location,
        capacity: parkingArea.capacity
      });
    } else {
      setIsEditing(false);
      setSelectedId(null);
      setFormData({
        name: '',
        location: '',
        capacity: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData({
      name: '',
      location: '',
      capacity: 0
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = () => {
    if (isEditing && selectedId) {
      updateMutation.mutate({ id: selectedId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this parking area?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error loading parking areas. Please try again later.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Parking Areas</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add Parking Area
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {parkingAreas.length === 0 ? (
          <Box>
            <Typography>No parking areas found. Click "Add Parking Area" to create one.</Typography>
          </Box>
        ) : (
          parkingAreas.map((parkingArea) => (
            <Card key={parkingArea.id} sx={{ width: '100%' }}>
              <CardContent>
                <Typography variant="h6">{parkingArea.name}</Typography>
                <Typography color="textSecondary">Location: {parkingArea.location}</Typography>
                <Typography>Capacity: {parkingArea.capacity}</Typography>
                <Typography>Status: {parkingArea.status}</Typography>
                <Box mt={2} display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleOpenDialog(parkingArea)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(parkingArea.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Parking Area' : 'Add Parking Area'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="location"
              label="Location"
              value={formData.location}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="capacity"
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 