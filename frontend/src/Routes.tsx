import { Navigate, Route, Routes as RouterRoutes, BrowserRouter as Router, Outlet } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './hooks/useAuth';

// Lazy loading untuk pages
import React, { Suspense } from 'react';
// @ts-ignore
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
// @ts-ignore
const VehiclesPage = React.lazy(() => import('./pages/VehiclesPage'));
// @ts-ignore
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
// @ts-ignore
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
// @ts-ignore
const ExitGatePage = React.lazy(() => import('./pages/ExitGatePage'));
// @ts-ignore
const ParkingSessionsPage = React.lazy(() => import('./pages/ParkingSessionsPage'));
// @ts-ignore
const UserManualPage = React.lazy(() => import('./pages/UserManualPage'));
// @ts-ignore
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
// @ts-ignore
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <p>Loading...</p>
  </div>
);

const Routes = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <RouterRoutes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Outlet />
                </MainLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="exit-gate" element={<ExitGatePage />} />
            <Route path="parking-sessions" element={<ParkingSessionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="user-manual" element={<UserManualPage />} />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </RouterRoutes>
      </Suspense>
    </Router>
  );
};

// ProtectedRoute component to handle authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default Routes; 