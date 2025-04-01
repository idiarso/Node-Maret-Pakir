import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EntryPage from '../EntryPage';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../theme';

// Mock fetch
global.fetch = jest.fn();

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
      }],
    }),
  },
});

describe('EntryPage', () => {
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
        json: () => Promise.resolve({ success: true, message: 'Data berhasil disimpan' }),
      })
    );
  });

  it('renders entry form correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <EntryPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Entry Point')).toBeInTheDocument();
    expect(screen.getByLabelText('Nomor Plat')).toBeInTheDocument();
    expect(screen.getByLabelText('Jenis Kendaraan')).toBeInTheDocument();
    expect(screen.getByText('Ambil Foto')).toBeInTheDocument();
  });

  it('shows error when form is submitted without required fields', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <EntryPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    const submitButton = screen.getByText('Simpan');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Semua field harus diisi')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <EntryPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Nomor Plat'), {
      target: { value: 'B1234CD' },
    });
    fireEvent.mouseDown(screen.getByLabelText('Jenis Kendaraan'));
    fireEvent.click(screen.getByText('Mobil'));

    // Mock photo capture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, 100, 100);
    }
    const photoData = canvas.toDataURL('image/jpeg');

    // Submit the form
    const submitButton = screen.getByText('Simpan');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      });
    });
  });

  it('shows error when API call fails', async () => {
    // Mock API failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <EntryPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Nomor Plat'), {
      target: { value: 'B1234CD' },
    });
    fireEvent.mouseDown(screen.getByLabelText('Jenis Kendaraan'));
    fireEvent.click(screen.getByText('Mobil'));

    // Submit the form
    const submitButton = screen.getByText('Simpan');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Gagal menyimpan data kendaraan')).toBeInTheDocument();
    });
  });

  it('handles camera access error', async () => {
    // Mock camera access error
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(
      new Error('Camera access denied')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <EntryPage />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tidak dapat mengakses kamera')).toBeInTheDocument();
    });
  });
}); 