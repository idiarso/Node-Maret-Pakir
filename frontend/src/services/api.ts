import axios from 'axios';
import { Payment, PaymentFormData, Ticket, Device, Gate, ApiResponse, ParkingSession, ParkingRate, Membership, OperatorShift, SystemSettings, LanguageSettings, BackupSettings } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Payment API functions
export const getPayments = async (): Promise<Payment[]> => {
  const response = await api.get<Payment[]>('/payments');
  return response.data as Payment[];
};

export const createPayment = async (data: PaymentFormData): Promise<Payment> => {
  const response = await api.post<Payment>('/payments', data);
  return response.data as Payment;
};

// Ticket API functions
export const getTickets = async (): Promise<Ticket[]> => {
  const response = await api.get<{data: Ticket[]}>('/tickets');
  // Handle API response structure with data property
  return response.data.data || [];
};

export const getTicketById = async (id: string): Promise<Ticket> => {
  const response = await api.get<Ticket>(`/tickets/${id}`);
  return response.data as Ticket;
};

export const updateTicket = async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
  const response = await api.patch<Ticket>(`/tickets/${id}`, data);
  return response.data as Ticket;
};

export const getPaymentById = async (id: string) => {
  const response = await api.get<Payment>(`/payments/${id}`);
  return response.data as Payment;
};

// Devices API
export const deviceService = {
  getAll: async (): Promise<Device[]> => {
    const response = await api.get<Device[]>('/devices');
    return response.data as Device[];
  },
  getById: async (id: number): Promise<Device> => {
    const response = await api.get<Device>(`/devices/${id}`);
    return response.data as Device;
  },
  create: async (device: Partial<Device>): Promise<Device> => {
    const response = await api.post<Device>('/devices', device);
    return response.data as Device;
  },
  update: async (id: number, device: Partial<Device>): Promise<Device> => {
    const response = await api.put<Device>(`/devices/${id}`, device);
    return response.data as Device;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/devices/${id}`);
  },
};

// Parking Sessions API
export const parkingSessionService = {
  getAll: async (): Promise<ParkingSession[]> => {
    const response = await api.get<{data: ParkingSession[]}>('/parking-sessions');
    return response.data.data as ParkingSession[];
  },
  getById: async (id: number): Promise<ParkingSession> => {
    const response = await api.get<ParkingSession>(`/parking-sessions/${id}`);
    return response.data as ParkingSession;
  },
  update: async (id: number, data: Partial<ParkingSession>): Promise<ParkingSession> => {
    const response = await api.put<ParkingSession>(`/parking-sessions/${id}`, data);
    return response.data as ParkingSession;
  },
  complete: async (id: number): Promise<ParkingSession> => {
    const response = await api.post<ParkingSession>(`/parking-sessions/${id}/complete`);
    return response.data as ParkingSession;
  }
};

// Gates API
export const gateService = {
  getAll: async (): Promise<Gate[]> => {
    const response = await api.get<Gate[]>('/gates');
    return response.data as Gate[];
  },
  getById: async (id: number): Promise<Gate> => {
    const response = await api.get<Gate>(`/gates/${id}`);
    return response.data as Gate;
  },
  create: async (gate: Partial<Gate>): Promise<Gate> => {
    const response = await api.post<Gate>('/gates', gate);
    return response.data as Gate;
  },
  update: async (id: number, gate: Partial<Gate>): Promise<Gate> => {
    const response = await api.put<Gate>(`/gates/${id}`, gate);
    return response.data as Gate;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/gates/${id}`);
  },
  changeStatus: async (id: number, status: string): Promise<Gate> => {
    const response = await api.post<Gate>(`/gates/${id}/status`, { status });
    return response.data as Gate;
  },
};

// Parking Rates API
export const parkingRateService = {
  getAll: async (): Promise<ParkingRate[]> => {
    const response = await api.get<ParkingRate[]>('/parking-rates');
    return response.data as ParkingRate[];
  },
  getById: async (id: number): Promise<ParkingRate> => {
    const response = await api.get<ParkingRate>(`/parking-rates/${id}`);
    return response.data as ParkingRate;
  },
  create: async (rate: Partial<ParkingRate>): Promise<ParkingRate> => {
    const response = await api.post<ParkingRate>('/parking-rates', rate);
    return response.data as ParkingRate;
  },
  update: async (id: number, rate: Partial<ParkingRate>): Promise<ParkingRate> => {
    const response = await api.put<ParkingRate>(`/parking-rates/${id}`, rate);
    return response.data as ParkingRate;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/parking-rates/${id}`);
  }
};

// Memberships API
export const membershipService = {
  getAll: async (): Promise<Membership[]> => {
    const response = await api.get<Membership[]>('/memberships');
    return response.data as Membership[];
  },
  getById: async (id: number): Promise<Membership> => {
    const response = await api.get<Membership>(`/memberships/${id}`);
    return response.data as Membership;
  },
  create: async (membership: Partial<Membership>): Promise<Membership> => {
    const response = await api.post<Membership>('/memberships', membership);
    return response.data as Membership;
  },
  update: async (id: number, membership: Partial<Membership>): Promise<Membership> => {
    const response = await api.put<Membership>(`/memberships/${id}`, membership);
    return response.data as Membership;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/memberships/${id}`);
  }
};

// Shifts API
export const shiftService = {
  getAll: async (): Promise<OperatorShift[]> => {
    const response = await api.get<OperatorShift[]>('/shifts');
    return response.data as OperatorShift[];
  },
  getById: async (id: number): Promise<OperatorShift> => {
    const response = await api.get<OperatorShift>(`/shifts/${id}`);
    return response.data as OperatorShift;
  },
  create: async (shift: Partial<OperatorShift>): Promise<OperatorShift> => {
    const response = await api.post<OperatorShift>('/shifts', shift);
    return response.data as OperatorShift;
  },
  update: async (id: number, shift: Partial<OperatorShift>): Promise<OperatorShift> => {
    const response = await api.put<OperatorShift>(`/shifts/${id}`, shift);
    return response.data as OperatorShift;
  },
  complete: async (id: number): Promise<OperatorShift> => {
    const response = await api.post<OperatorShift>(`/shifts/${id}/complete`);
    return response.data as OperatorShift;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/shifts/${id}`);
  }
};

// Settings API
export const settingsService = {
  // System settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await api.get<SystemSettings>('/settings/system');
    return response.data as SystemSettings;
  },
  updateSystemSettings: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await api.put<SystemSettings>('/settings/system', data);
    return response.data as SystemSettings;
  },
  
  // Language settings
  getLanguageSettings: async (): Promise<LanguageSettings> => {
    const response = await api.get<LanguageSettings>('/settings/language');
    return response.data as LanguageSettings;
  },
  updateLanguageSettings: async (data: Partial<LanguageSettings>): Promise<LanguageSettings> => {
    const response = await api.put<LanguageSettings>('/settings/language', data);
    return response.data as LanguageSettings;
  },
  
  // Backup settings
  getBackupSettings: async (): Promise<BackupSettings> => {
    const response = await api.get<BackupSettings>('/settings/backup');
    return response.data as BackupSettings;
  },
  updateBackupSettings: async (data: Partial<BackupSettings>): Promise<BackupSettings> => {
    const response = await api.put<BackupSettings>('/settings/backup', data);
    return response.data as BackupSettings;
  },
  triggerBackup: async (): Promise<{success: boolean, message: string}> => {
    const response = await api.post<{success: boolean, message: string}>('/settings/backup/trigger');
    return response.data;
  }
};

export default api; 