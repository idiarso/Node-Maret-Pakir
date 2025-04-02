import React, { FC, useState } from 'react';
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
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import { shiftService, gateService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Temporarily using any type instead of OperatorShift
// import { OperatorShift } from '../types';
import { format } from 'date-fns';

const ShiftsPage: FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  
  // Simplify form data
  const [operatorId, setOperatorId] = useState<number>(1);

  const { 
    data: shifts = [], 
    isLoading: isLoadingShifts,
    isError: shiftsError,
    refetch: refetchShifts
  } = useQuery<any[]>({
    queryKey: ['shifts'],
    queryFn: shiftService.getAll
  });

  const { 
    data: gates = []
  } = useQuery({
    queryKey: ['gates'],
    queryFn: gateService.getAll
  });

  const createShiftMutation = useMutation({
    mutationFn: (data: Partial<any>) => shiftService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      handleCloseDialog();
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<any> }) => 
      shiftService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      handleCloseDialog();
    }
  });

  const completeShiftMutation = useMutation({
    mutationFn: (id: number) => shiftService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: number) => shiftService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    }
  });

  const handleOpenDialog = (shift?: any) => {
    if (shift) {
      setSelectedShift(shift);
      setOperatorId(shift.operator_id);
    } else {
      setSelectedShift(null);
      setOperatorId(1);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedShift(null);
  };

  const handleSubmit = () => {
    try {
      if (selectedShift) {
        // Untuk update shift
        updateShiftMutation.mutate({ 
          id: selectedShift.id, 
          data: {
            operator_id: operatorId
          } 
        });
      } else {
        // Untuk create new shift
        const newShiftData = {
          operator_id: operatorId
        };
        
        console.log('Creating new shift with data:', newShiftData);
        createShiftMutation.mutate(newShiftData);
      }
    } catch (error) {
      console.error('Error submitting shift:', error);
    }
  };

  const handleCompleteShift = (id: number) => {
    if (window.confirm('Are you sure you want to complete this shift?')) {
      completeShiftMutation.mutate(id);
    }
  };

  const handleDeleteShift = (id: number) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      deleteShiftMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'primary';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (date: Date | string) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  const formatDuration = (startTime: Date | string, endTime?: Date | string) => {
    if (!startTime || !endTime) return '-';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const filteredShifts = shifts.filter((shift: any) => {
    const opName = `Operator ${shift.operator_id}`;
    return opName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Operator Shifts
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={() => refetchShifts()}
            disabled={isLoadingShifts}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Start New Shift
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        Manage operator shifts and assignments.
      </Typography>

      {shiftsError && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff4f4' }}>
          <Typography color="error">Error loading shifts</Typography>
        </Paper>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by operator name or gate"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper sx={{ p: 3, mt: 2 }}>
        {isLoadingShifts ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredShifts.length === 0 ? (
          <Typography>No shifts found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Operator</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Transactions</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredShifts.map((shift: any) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.id}</TableCell>
                    <TableCell>{`Operator ${shift.operator_id}`}</TableCell>
                    <TableCell>{formatDateTime(shift.shift_start)}</TableCell>
                    <TableCell>{shift.shift_end ? formatDateTime(shift.shift_end) : '-'}</TableCell>
                    <TableCell>{formatDuration(shift.shift_start, shift.shift_end)}</TableCell>
                    <TableCell>{shift.total_transactions}</TableCell>
                    <TableCell>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(shift.total_amount))}</TableCell>
                    <TableCell>
                      <Chip 
                        label={shift.status} 
                        color={getStatusColor(shift.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {shift.status === 'ACTIVE' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenDialog(shift)}
                            title="Edit Shift"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => handleCompleteShift(shift.id)}
                            title="Complete Shift"
                          >
                            <DoneIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteShift(shift.id)}
                        title="Delete Shift"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{selectedShift ? 'Edit Shift' : 'Start New Shift'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Operator ID"
              type="number"
              fullWidth
              value={operatorId}
              onChange={(e) => setOperatorId(Number(e.target.value))}
              inputProps={{ min: 1 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {selectedShift ? 'Update' : 'Start Shift'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftsPage; 