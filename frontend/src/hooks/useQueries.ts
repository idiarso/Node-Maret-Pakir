import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../utils/api';
import {
  User,
  UserInput,
  Vehicle,
  VehicleInput,
  ParkingSession,
  ParkingSessionInput,
  Payment,
  PaymentInput,
  ReportFilter,
  ReportSummary,
  PaginatedResponse,
} from '../types';

// User queries
export const useUsers = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<User>>(['users', page, pageSize], () =>
    api.get('/users', { page, pageSize })
  );
};

export const useUser = (id: string) => {
  return useQuery<User>(['users', id], () => api.get(`/users/${id}`));
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation((data: UserInput) => api.post('/users', data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};

export const useUpdateUser = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation((data: UserInput) => api.put(`/users/${id}`, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['users', id]);
    },
  });
};

// Vehicle queries
export const useVehicles = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<Vehicle>>(['vehicles', page, pageSize], () =>
    api.get('/vehicles', { page, pageSize })
  );
};

export const useVehicle = (id: string) => {
  return useQuery<Vehicle>(['vehicles', id], () => api.get(`/vehicles/${id}`));
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation((data: VehicleInput) => api.post('/vehicles', data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['vehicles']);
    },
  });
};

// Parking session queries
export const useParkingSessions = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<ParkingSession>>(
    ['parkingSessions', page, pageSize],
    () => api.get('/parking-sessions', { page, pageSize })
  );
};

export const useParkingSession = (id: string) => {
  return useQuery<ParkingSession>(['parkingSessions', id], () =>
    api.get(`/parking-sessions/${id}`)
  );
};

export const useCreateParkingSession = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (data: ParkingSessionInput) => api.post('/parking-sessions', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['parkingSessions']);
      },
    }
  );
};

export const useUpdateParkingSession = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (data: ParkingSessionInput) => api.put(`/parking-sessions/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['parkingSessions']);
        queryClient.invalidateQueries(['parkingSessions', id]);
      },
    }
  );
};

// Payment queries
export const usePayments = (page = 1, pageSize = 10) => {
  return useQuery<PaginatedResponse<Payment>>(['payments', page, pageSize], () =>
    api.get('/payments', { page, pageSize })
  );
};

export const usePayment = (id: string) => {
  return useQuery<Payment>(['payments', id], () => api.get(`/payments/${id}`));
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation((data: PaymentInput) => api.post('/payments', data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['parkingSessions']);
    },
  });
};

// Report queries
export const useReport = (filter: ReportFilter) => {
  return useQuery<ReportSummary>(['report', filter], () =>
    api.get('/reports/summary', filter)
  );
};

export default {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useVehicles,
  useVehicle,
  useCreateVehicle,
  useParkingSessions,
  useParkingSession,
  useCreateParkingSession,
  useUpdateParkingSession,
  usePayments,
  usePayment,
  useCreatePayment,
  useReport,
}; 