import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportData {
  id: number;
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  duration: number;
  parkingFee: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
}

interface ReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  vehicleType: string;
  paymentStatus: string;
}

const ReportsPage: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: null,
    endDate: null,
    vehicleType: '',
    paymentStatus: '',
  });

  const { data: reports = [], isLoading, error } = useQuery<ReportData[]>({
    queryKey: ['reports', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }
      if (filters.vehicleType) {
        queryParams.append('vehicleType', filters.vehicleType);
      }
      if (filters.paymentStatus) {
        queryParams.append('paymentStatus', filters.paymentStatus);
      }

      const response = await fetch(`/api/reports?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data laporan');
      }
      return response.json();
    },
  });

  const handleExport = () => {
    const data = reports.map(report => ({
      'ID': report.id,
      'Plat Nomor': report.plateNumber,
      'Jenis Kendaraan': report.vehicleType === 'car' ? 'Mobil' :
                        report.vehicleType === 'motorcycle' ? 'Motor' :
                        report.vehicleType === 'truck' ? 'Truk' :
                        report.vehicleType,
      'Waktu Masuk': format(new Date(report.entryTime), 'dd/MM/yyyy HH:mm', { locale: id }),
      'Waktu Keluar': report.exitTime ? format(new Date(report.exitTime), 'dd/MM/yyyy HH:mm', { locale: id }) : '-',
      'Durasi': `${Math.floor(report.duration / 60)} jam ${report.duration % 60} menit`,
      'Biaya': `Rp ${report.parkingFee.toLocaleString('id-ID')}`,
      'Status Pembayaran': report.paymentStatus === 'completed' ? 'Selesai' :
                          report.paymentStatus === 'pending' ? 'Menunggu' :
                          'Gagal',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `parking_report_${format(new Date(), 'dd_MM_yyyy', { locale: id })}.xlsx`;
    saveAs(dataBlob, fileName);
  };

  const calculateTotalRevenue = () => {
    return reports
      .filter(report => report.paymentStatus === 'completed')
      .reduce((sum, report) => sum + report.parkingFee, 0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Laporan Parkir</Typography>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={isLoading || reports.length === 0}
          >
            Export Excel
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label="Tanggal Mulai"
                value={filters.startDate}
                onChange={(date: Date | null) => setFilters(prev => ({ ...prev, startDate: date }))}
                slotProps={{ textField: { sx: { minWidth: 200 } } }}
              />
              <DatePicker
                label="Tanggal Selesai"
                value={filters.endDate}
                onChange={(date: Date | null) => setFilters(prev => ({ ...prev, endDate: date }))}
                slotProps={{ textField: { sx: { minWidth: 200 } } }}
              />
              <TextField
                select
                label="Jenis Kendaraan"
                value={filters.vehicleType}
                onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value }))}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="car">Mobil</MenuItem>
                <MenuItem value="motorcycle">Motor</MenuItem>
                <MenuItem value="truck">Truk</MenuItem>
              </TextField>
              <TextField
                select
                label="Status Pembayaran"
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Semua</MenuItem>
                <MenuItem value="completed">Selesai</MenuItem>
                <MenuItem value="pending">Menunggu</MenuItem>
                <MenuItem value="failed">Gagal</MenuItem>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data'}
          </Alert>
        ) : (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Pendapatan
                </Typography>
                <Typography variant="h4" color="primary">
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    `Rp ${calculateTotalRevenue().toLocaleString('id-ID')}`
                  )}
                </Typography>
              </CardContent>
            </Card>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Plat Nomor</TableCell>
                    <TableCell>Jenis Kendaraan</TableCell>
                    <TableCell>Waktu Masuk</TableCell>
                    <TableCell>Waktu Keluar</TableCell>
                    <TableCell>Durasi</TableCell>
                    <TableCell>Biaya</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.id}</TableCell>
                        <TableCell>{report.plateNumber}</TableCell>
                        <TableCell>
                          {report.vehicleType === 'car' ? 'Mobil' :
                           report.vehicleType === 'motorcycle' ? 'Motor' :
                           report.vehicleType === 'truck' ? 'Truk' :
                           report.vehicleType}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.entryTime), 'dd/MM/yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell>
                          {report.exitTime
                            ? format(new Date(report.exitTime), 'dd/MM/yyyy HH:mm', { locale: id })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {`${Math.floor(report.duration / 60)} jam ${report.duration % 60} menit`}
                        </TableCell>
                        <TableCell>
                          Rp {report.parkingFee.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Typography
                            color={
                              report.paymentStatus === 'completed' ? 'success.main' :
                              report.paymentStatus === 'pending' ? 'warning.main' :
                              'error.main'
                            }
                          >
                            {report.paymentStatus === 'completed' ? 'Selesai' :
                             report.paymentStatus === 'pending' ? 'Menunggu' :
                             'Gagal'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ReportsPage; 