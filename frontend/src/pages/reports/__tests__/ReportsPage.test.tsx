import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportsPage from '../ReportsPage';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../theme';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock fetch
global.fetch = jest.fn();

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

const mockReports = [
  {
    id: 1,
    plateNumber: 'B1234CD',
    vehicleType: 'car',
    entryTime: '2024-01-01T10:00:00Z',
    exitTime: '2024-01-01T12:00:00Z',
    duration: 120,
    parkingFee: 10000,
    paymentStatus: 'completed',
  },
  {
    id: 2,
    plateNumber: 'B5678EF',
    vehicleType: 'motorcycle',
    entryTime: '2024-01-01T14:00:00Z',
    exitTime: null,
    duration: 60,
    parkingFee: 5000,
    paymentStatus: 'pending',
  },
];

describe('ReportsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Mock successful API response
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReports),
      })
    );
  });

  it('renders reports page correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Laporan Parkir')).toBeInTheDocument();
    expect(screen.getByText('Export Excel')).toBeInTheDocument();
    expect(screen.getByText('Total Pendapatan')).toBeInTheDocument();
  });

  it('displays reports data correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('B1234CD')).toBeInTheDocument();
      expect(screen.getByText('Mobil')).toBeInTheDocument();
      expect(screen.getByText('Rp 10.000')).toBeInTheDocument();
      expect(screen.getByText('Selesai')).toBeInTheDocument();
    });
  });

  it('filters reports by vehicle type', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    const vehicleTypeSelect = screen.getByLabelText('Jenis Kendaraan');
    fireEvent.mouseDown(vehicleTypeSelect);
    fireEvent.click(screen.getByText('Mobil'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vehicleType=car')
      );
    });
  });

  it('filters reports by payment status', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    const paymentStatusSelect = screen.getByLabelText('Status Pembayaran');
    fireEvent.mouseDown(paymentStatusSelect);
    fireEvent.click(screen.getByText('Selesai'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('paymentStatus=completed')
      );
    });
  });

  it('exports reports to Excel', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const exportButton = screen.getByText('Export Excel');
      fireEvent.click(exportButton);
    });

    // Verify that file-saver was called
    expect(require('file-saver').saveAs).toHaveBeenCalled();
  });

  it('shows error when API call fails', async () => {
    // Mock API failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Gagal memuat data laporan')).toBeInTheDocument();
    });
  });

  it('calculates total revenue correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ReportsPage />
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Rp 10.000')).toBeInTheDocument();
    });
  });
}); 