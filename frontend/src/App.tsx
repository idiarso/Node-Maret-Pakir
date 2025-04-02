import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { blue, orange } from '@mui/material/colors';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Error Handling
import ErrorBoundary from './components/ErrorBoundary';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/DashboardPage';
import ParkingSessionsPage from './pages/ParkingSessionsPage';
import TicketsPage from './pages/TicketsPage';
import ParkingAreasPage from './pages/ParkingAreasPage';
import ParkingRatesPage from './pages/ParkingRatesPage';
import VehiclesPage from './pages/VehiclesPage';
import MembershipsPage from './pages/MembershipsPage';
import PaymentsPage from './pages/PaymentsPage';
import UsersPage from './pages/UsersPage';
import DevicesPage from './pages/DevicesPage';
import GatesPage from './pages/GatesPage';
import ShiftsPage from './pages/ShiftsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LanguageSettingsPage from './pages/settings/LanguageSettingsPage';
import BackupSettingsPage from './pages/settings/BackupSettingsPage';
import SystemSettingsPage from './pages/settings/SystemSettingsPage';
import ParkingPage from './pages/ParkingPage';
import HelpPage from './pages/HelpPage';
import GatePageNew from './pages/GatePageNew';
import EntryGatePage from './pages/EntryGatePage';
import ExitGatePage from './pages/ExitGatePage';

// Create 404 page if it doesn't exist
const NotFoundPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
    <a href="/">Go back to homepage</a>
  </div>
);

// Define theme
const theme = createTheme({
  palette: {
    primary: blue,
    secondary: orange,
  },
});

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  
                  {/* Parking Management */}
                  <Route path="parking-sessions" element={<ParkingSessionsPage />} />
                  <Route path="tickets" element={<TicketsPage />} />
                  <Route path="parking-areas" element={<ParkingAreasPage />} />
                  <Route path="parking-rates" element={<ParkingRatesPage />} />
                  
                  {/* Customer Management */}
                  <Route path="vehicles" element={<VehiclesPage />} />
                  <Route path="memberships" element={<MembershipsPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  
                  {/* System */}
                  <Route path="users" element={<UsersPage />} />
                  <Route path="devices" element={<DevicesPage />} />
                  <Route path="gates" element={<GatesPage />} />
                  <Route path="shifts" element={<ShiftsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="settings/language" element={<LanguageSettingsPage />} />
                  <Route path="settings/backup" element={<BackupSettingsPage />} />
                  <Route path="settings/system" element={<SystemSettingsPage />} />
                  
                  {/* Legacy routes */}
                  <Route path="parking" element={<ParkingPage />} />
                  <Route path="help" element={<HelpPage />} />
                  <Route path="gates" element={<GatePageNew />} />
                  <Route path="entry-gate" element={<EntryGatePage />} />
                  <Route path="exit-gate" element={<ExitGatePage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App; 