import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemLogService } from '../services/systemLogService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Monitoring log sistem
interface SystemLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  userId: number;
  userName?: string;
}

const SystemLogsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [level, setLevel] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [openClearDialog, setOpenClearDialog] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['systemLogs', selectedDate, level, category],
    queryFn: () => systemLogService.getLogs({
      date: selectedDate,
      level: level === 'all' ? undefined : level,
      category: category === 'all' ? undefined : category,
    }),
  });

  const clearMutation = useMutation({
    mutationFn: systemLogService.clearLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemLogs'] });
      setOpenClearDialog(false);
    },
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const categories = Array.from(new Set(logs?.map(log => log.category) || []));

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
        <Typography variant="h4">Log Sistem</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => queryClient.invalidateQueries({ queryKey: ['systemLogs'] })}
              sx={{ mr: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Hapus Log">
            <IconButton
              color="error"
              onClick={() => setOpenClearDialog(true)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Log
              </Typography>
              <Typography variant="h4">
                {logs?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error
              </Typography>
              <Typography variant="h4" color="error">
                {logs?.filter(log => log.level === 'error').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Warning
              </Typography>
              <Typography variant="h4" color="warning.main">
                {logs?.filter(log => log.level === 'warning').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Info
              </Typography>
              <Typography variant="h4" color="info.main">
                {logs?.filter(log => log.level === 'info').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
                    <DatePicker
                      label="Tanggal"
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Kategori"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="all">Semua</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Logs Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Waktu</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Kategori</TableCell>
                      <TableCell>Pesan</TableCell>
                      <TableCell>User</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', {
                            locale: id,
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.level}
                            color={getLevelColor(log.level)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.category}</TableCell>
                        <TableCell>{log.message}</TableCell>
                        <TableCell>{log.userName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clear Logs Dialog */}
      <Dialog open={openClearDialog} onClose={() => setOpenClearDialog(false)}>
        <DialogTitle>Hapus Log</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus semua log? Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearDialog(false)}>Batal</Button>
          <Button
            onClick={() => clearMutation.mutate()}
            variant="contained"
            color="error"
            disabled={clearMutation.isPending}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemLogsPage; 