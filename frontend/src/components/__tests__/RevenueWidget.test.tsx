import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RevenueWidget from '../RevenueWidget';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme';

// Mock fetch
global.fetch = jest.fn();

const mockData = {
  todayRevenue: 100000,
  monthRevenue: 2000000,
  todayGrowth: 10,
  monthGrowth: 5,
};

describe('RevenueWidget', () => {
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
        json: () => Promise.resolve(mockData),
      })
    );
  });

  it('renders revenue widget correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Pendapatan Hari Ini')).toBeInTheDocument();
    expect(screen.getByText('Pendapatan Bulan Ini')).toBeInTheDocument();
  });

  it('displays revenue data correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findByText('Rp 100.000');
    await screen.findByText('Rp 2.000.000');
  });

  it('displays growth indicators correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findByText('+10%');
    await screen.findByText('+5%');
  });

  it('shows loading state while fetching data', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('shows error state when API call fails', async () => {
    // Mock API failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findByText('Gagal memuat data pendapatan');
  });

  it('handles undefined growth values', async () => {
    const dataWithoutGrowth = {
      todayRevenue: 100000,
      monthRevenue: 2000000,
      todayGrowth: undefined,
      monthGrowth: undefined,
    };

    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(dataWithoutGrowth),
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findByText('Rp 100.000');
    await screen.findByText('Rp 2.000.000');
    expect(screen.queryByText('+10%')).not.toBeInTheDocument();
    expect(screen.queryByText('+5%')).not.toBeInTheDocument();
  });

  it('formats currency values correctly', async () => {
    const dataWithLargeNumbers = {
      todayRevenue: 1000000,
      monthRevenue: 100000000,
      todayGrowth: 10,
      monthGrowth: 5,
    };

    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(dataWithLargeNumbers),
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RevenueWidget />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await screen.findByText('Rp 1.000.000');
    await screen.findByText('Rp 100.000.000');
  });
}); 