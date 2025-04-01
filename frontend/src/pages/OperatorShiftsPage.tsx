// Manajemen shift operator
interface OperatorShift {
  id: number;
  operatorId: number;
  operatorName: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed';
  cashAmount: number;
  transactionCount: number;
}

// Komponen untuk manajemen shift 

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as EndIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operatorShiftService } from '../services/operatorShiftService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const OperatorShiftsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedShift, setSelectedShift] = useState<OperatorShift | null>(null);
  const [openEndDialog, setOpenEndDialog] = useState(false);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['operatorShifts'],
    queryFn: operatorShiftService.getShifts,
  });

  const { data: currentShift } = useQuery({
    queryKey: ['currentShift'],
    queryFn: operatorShiftService.getCurrentShift,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const startMutation = useMutation({
    mutationFn: operatorShiftService.startShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operatorShifts', 'currentShift'] });
    },
  });

  const endMutation = useMutation({
    mutationFn: operatorShiftService.endShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operatorShifts', 'currentShift'] });
      setOpenEndDialog(false);
    },
  });

  const handleStartShift = () => {
    startMutation.mutate({
      operatorId: 1, // Replace with actual operator ID from auth context
    });
  };

  const handleEndShift = (shift: OperatorShift) => {
    setSelectedShift(shift);
    setOpenEndDialog(true);
  };

  const handleConfirmEndShift = () => {
    if (selectedShift) {
      endMutation.mutate(selectedShift.id);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Manajemen Shift Operator</Typography>
        {!currentShift && (
          <Button
            variant="contained"
            startIcon={<StartIcon />}
            onClick={handleStartShift}
            disabled={startMutation.isPending}
          >
            Mulai Shift
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Shift
              </Typography>
              <Typography variant="h4">
                {shifts?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shift Aktif
              </Typography>
              <Typography variant="h4" color="primary">
                {currentShift ? 1 : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Transaksi
              </Typography>
              <Typography variant="h4">
                {shifts?.reduce((sum, shift) => sum + shift.transactionCount, 0) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Kas
              </Typography>
              <Typography variant="h4">
                Rp {shifts?.reduce((sum, shift) => sum + shift.cashAmount, 0).toLocaleString() || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Shift Card */}
        {currentShift && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6">Shift Aktif</Typography>
                    <Typography>
                      Operator: {currentShift.operatorName}
                    </Typography>
                    <Typography>
                      Mulai: {format(new Date(currentShift.startTime), 'dd/MM/yyyy HH:mm', {
                        locale: id,
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6">
                      Rp {currentShift.cashAmount.toLocaleString()}
                    </Typography>
                    <Typography>
                      {currentShift.transactionCount} Transaksi
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<EndIcon />}
                      onClick={() => handleEndShift(currentShift)}
                      sx={{ mt: 2 }}
                    >
                      Akhiri Shift
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Shifts Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Operator</TableCell>
                      <TableCell>Mulai</TableCell>
                      <TableCell>Selesai</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Transaksi</TableCell>
                      <TableCell>Kas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shifts?.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.operatorName}</TableCell>
                        <TableCell>
                          {format(new Date(shift.startTime), 'dd/MM/yyyy HH:mm', {
                            locale: id,
                          })}
                        </TableCell>
                        <TableCell>
                          {shift.endTime
                            ? format(new Date(shift.endTime), 'dd/MM/yyyy HH:mm', {
                                locale: id,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={shift.status === 'active' ? 'Aktif' : 'Selesai'}
                            color={shift.status === 'active' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{shift.transactionCount}</TableCell>
                        <TableCell>
                          Rp {shift.cashAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* End Shift Dialog */}
      <Dialog open={openEndDialog} onClose={() => setOpenEndDialog(false)}>
        <DialogTitle>Akhiri Shift</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin mengakhiri shift ini?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEndDialog(false)}>Batal</Button>
          <Button
            onClick={handleConfirmEndShift}
            variant="contained"
            color="error"
            disabled={endMutation.isPending}
          >
            Akhiri Shift
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OperatorShiftsPage; 