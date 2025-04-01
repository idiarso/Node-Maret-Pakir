import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { hardwareService } from '../services/hardwareService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface HardwareStatus {
  id: number;
  deviceId: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  temperature: number;
  lastUpdate: string;
  status: 'normal' | 'warning' | 'critical';
}

const HardwareMonitoringPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  const { data: statuses, isLoading, refetch } = useQuery({
    queryKey: ['hardwareStatus'],
    queryFn: hardwareService.getStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
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
        <Typography variant="h4">Monitoring Hardware</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Devices
              </Typography>
              <Typography variant="h4">
                {statuses?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Normal Status
              </Typography>
              <Typography variant="h4" color="success.main">
                {statuses?.filter(s => s.status === 'normal').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Warning Status
              </Typography>
              <Typography variant="h4" color="warning.main">
                {statuses?.filter(s => s.status === 'warning').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Critical Status
              </Typography>
              <Typography variant="h4" color="error.main">
                {statuses?.filter(s => s.status === 'critical').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Device ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>CPU Usage</TableCell>
                      <TableCell>Memory Usage</TableCell>
                      <TableCell>Disk Usage</TableCell>
                      <TableCell>Temperature</TableCell>
                      <TableCell>Last Update</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statuses?.map((status) => (
                      <TableRow
                        key={status.id}
                        hover
                        selected={selectedDevice === status.deviceId}
                        onClick={() => setSelectedDevice(status.deviceId)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{status.deviceId}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(status.status)}
                            label={status.status}
                            color={getStatusColor(status.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{status.cpuUsage}%</TableCell>
                        <TableCell>{status.memoryUsage}%</TableCell>
                        <TableCell>{status.diskUsage}%</TableCell>
                        <TableCell>{status.temperature}°C</TableCell>
                        <TableCell>
                          {format(new Date(status.lastUpdate), 'dd/MM/yyyy HH:mm:ss', {
                            locale: id,
                          })}
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
    </Box>
  );
};

export default HardwareMonitoringPage; 