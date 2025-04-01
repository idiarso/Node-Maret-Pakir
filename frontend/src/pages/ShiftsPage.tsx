import { useState, FC } from 'react';
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
import { OperatorShift, Gate } from '../types';
import { format } from 'date-fns';

const ShiftsPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<OperatorShift | null>(null);
  const [formData, setFormData] = useState<Partial<OperatorShift>>({
    operatorId: 0,
    operatorName: '',
    assignedGateId: 0,
    startTime: new Date(),
    status: 'ACTIVE'
  });
  
  const queryClient = useQueryClient();
  
  const { 
    data: shifts = [], 
    isLoading: isLoadingShifts, 
    error: shiftsError, 
    refetch: refetchShifts 
  } = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftService.getAll
  });

  const { 
    data: gates = [], 
    isLoading: isLoadingGates
  } = useQuery({
    queryKey: ['gates'],
    queryFn: gateService.getAll
  });

  const createShiftMutation = useMutation({
    mutationFn: (data: Partial<OperatorShift>) => shiftService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      handleCloseDialog();
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<OperatorShift> }) => 
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

  const handleOpenDialog = (shift?: OperatorShift) => {
    if (shift) {
      setSelectedShift(shift);
      setFormData(shift);
    } else {
      setSelectedShift(null);
      setFormData({
        operatorId: 1, // Default operator ID
        operatorName: '',
        assignedGateId: gates.length > 0 ? gates[0].id : undefined,
        startTime: new Date(),
        status: 'ACTIVE'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedShift(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name as string]: value
    });
  };

  const handleSubmit = () => {
    if (selectedShift) {
      updateShiftMutation.mutate({ id: selectedShift.id, data: formData });
    } else {
      createShiftMutation.mutate(formData);
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

  const filteredShifts = shifts.filter(shift => 
    shift.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shift.assignedGateName && shift.assignedGateName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                  <TableCell>Assigned Gate</TableCell>
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
                {filteredShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.id}</TableCell>
                    <TableCell>{shift.operatorName}</TableCell>
                    <TableCell>{shift.assignedGateName || '-'}</TableCell>
                    <TableCell>{formatDateTime(shift.startTime)}</TableCell>
                    <TableCell>{shift.endTime ? formatDateTime(shift.endTime) : '-'}</TableCell>
                    <TableCell>{formatDuration(shift.startTime, shift.endTime)}</TableCell>
                    <TableCell>{shift.totalTransactions || 0}</TableCell>
                    <TableCell>
                      {shift.totalRevenue ? `Rp ${shift.totalRevenue.toLocaleString('id-ID')}` : 'Rp 0'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={shift.status} 
                        color={getStatusColor(shift.status) as any}
                        size="small"
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedShift ? 'Edit Shift' : 'Start New Shift'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Operator Name"
              name="operatorName"
              value={formData.operatorName || ''}
              onChange={handleInputChange}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="gate-label">Assigned Gate</InputLabel>
              <Select
                labelId="gate-label"
                name="assignedGateId"
                value={formData.assignedGateId || ''}
                label="Assigned Gate"
                onChange={handleInputChange}
              >
                <MenuItem value={0}>None</MenuItem>
                {gates.map((gate) => (
                  <MenuItem key={gate.id} value={gate.id}>
                    {gate.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              fullWidth
              label="Start Time"
              name="startTime"
              type="datetime-local"
              value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            {selectedShift && (
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status || ''}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={createShiftMutation.isPending || updateShiftMutation.isPending}
          >
            {selectedShift ? 'Update' : 'Start Shift'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftsPage; 