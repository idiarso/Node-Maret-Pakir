import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ParkingPage from './pages/ParkingPage';
import PaymentsPage from './pages/PaymentsPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import HelpPage from './pages/HelpPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ParkingSessionsPage from './pages/ParkingSessionsPage';
import TicketsPage from './pages/TicketsPage';
import VehiclesPage from './pages/VehiclesPage';
import MembershipsPage from './pages/MembershipsPage';
import ParkingAreasPage from './pages/ParkingAreasPage';
import ParkingRatesPage from './pages/ParkingRatesPage';
import DevicesPage from './pages/DevicesPage';
import GatesPage from './pages/GatesPage';
import ShiftsPage from './pages/ShiftsPage';
import LanguageSettingsPage from './pages/settings/LanguageSettingsPage';
import BackupSettingsPage from './pages/settings/BackupSettingsPage';
import SystemSettingsPage from './pages/settings/SystemSettingsPage';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './contexts/LanguageContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
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
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App; 