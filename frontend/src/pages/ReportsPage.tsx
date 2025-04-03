import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import Breadcrumbs from '../components/Breadcrumbs';
import reportService from '../services/reportService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ChartData {
  name: string;
  value: number;
}

const ReportsPage = () => {
  const [reportType, setReportType] = useState('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedData, setDisplayedData] = useState<ChartData[]>([]);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError('Silakan pilih tanggal awal dan akhir');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        startDate,
        endDate,
        reportType,
      };

      let response;
      switch (reportType) {
        case 'revenue':
          response = await reportService.getRevenueReport(params);
          setDisplayedData(formatRevenueData(response));
          break;
        case 'occupancy':
          response = await reportService.getOccupancyReport(params);
          setDisplayedData(formatOccupancyData(response));
          break;
        case 'vehicleTypes':
          response = await reportService.getVehicleTypeReport(params);
          setDisplayedData(formatVehicleTypeData(response));
          break;
        case 'peakHours':
          response = await reportService.getPeakHoursReport(params);
          setDisplayedData(formatPeakHoursData(response));
          break;
        default:
          throw new Error('Tipe laporan tidak valid');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data laporan');
      setDisplayedData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRevenueData = (data: any[]): ChartData[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.date,
      value: item.amount
    }));
  };

  const formatOccupancyData = (data: any[]): ChartData[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.time,
      value: item.percentage
    }));
  };

  const formatVehicleTypeData = (data: any[]): ChartData[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.type,
      value: item.count
    }));
  };

  const formatPeakHoursData = (data: any[]): ChartData[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.hour,
      value: item.count
    }));
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate, reportType]);

  const handleExport = async () => {
    try {
      const blob = await reportService.exportReport({
        startDate,
        endDate,
        reportType,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengekspor laporan');
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!displayedData || displayedData.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          Pilih rentang tanggal untuk melihat laporan
        </Alert>
      );
    }

    switch (reportType) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={displayedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Pendapatan" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'occupancy':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={displayedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <RechartsTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                name="Tingkat Okupansi (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'vehicleTypes':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={displayedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {displayedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'peakHours':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={displayedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                name="Jumlah Kendaraan"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box p={3}>
      <Breadcrumbs items={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Laporan' }]} />
      <PageHeader title="Laporan" subtitle="Lihat statistik dan analisis data parkir" />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tipe Laporan</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Tipe Laporan"
                >
                  <MenuItem value="revenue">Pendapatan</MenuItem>
                  <MenuItem value="occupancy">Okupansi</MenuItem>
                  <MenuItem value="vehicleTypes">Tipe Kendaraan</MenuItem>
                  <MenuItem value="peakHours">Jam Sibuk</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Tanggal Mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Tanggal Akhir"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={fetchData}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleExport}
                  startIcon={<DownloadIcon />}
                  disabled={loading || !displayedData.length}
                >
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {reportType === 'revenue' && 'Grafik Pendapatan'}
              {reportType === 'occupancy' && 'Grafik Okupansi'}
              {reportType === 'vehicleTypes' && 'Distribusi Tipe Kendaraan'}
              {reportType === 'peakHours' && 'Analisis Jam Sibuk'}
            </Typography>
            <Tooltip title="Klik untuk melihat detail">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {renderChart()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsPage; 