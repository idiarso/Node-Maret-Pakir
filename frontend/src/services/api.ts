import axios from 'axios';
import { Payment, PaymentFormData, Ticket, Device, Gate, ApiResponse, ParkingSession, ParkingRate, Membership, OperatorShift, SystemSettings, LanguageSettings, BackupSettings } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Dashboard data interface
export interface DashboardData {
  activeTickets: number;
  totalTickets: number;
  availableSpots: number;
  totalCapacity: number;
  occupancyRate: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageDuration: string;
  peakHours: string[];
  totalVehicles: number;
  vehicleTypes: {
    car: number;
    motorcycle: number;
    truck: number;
  };
  deviceStatus: {
    online: number;
    offline: number;
    maintenance: number;
  };
  recentTransactions: Array<{
    id: number;
    licensePlate: string;
    amount: number;
    vehicleType: string;
    timestamp: string;
    duration: string;
  }>;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

// Error handling interface
export interface ApiError {
  isConnectionError: boolean;
  status?: number;
  message: string;
}

// Track server connection status to avoid excessive failed requests
let isServerConnected = true;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 10000; // 10 seconds between connection checks

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout to avoid hanging requests
});

// Request interceptor to add the auth token and check server status
api.interceptors.request.use(
  (config) => {
    // Check if server is connected and if we need to check again
    const now = Date.now();
    if (!isServerConnected && (now - lastConnectionCheck > CONNECTION_CHECK_INTERVAL)) {
      // Use a sync check to avoid Promise return type issue
      if (config.url !== '/health') {
        // For non-health check requests when server is down, fail fast
        throw {
          isConnectionError: true,
          message: 'Server tidak tersedia. Permintaan ditunda.'
        };
      }
    }
    
    // Add the auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Mark server as connected on successful response
    isServerConnected = true;
    return response;
  },
  (error) => {
    // Handle server errors with fallback data for important endpoints
    if (error.response) {
      if (error.response.status === 500) {
        console.error('Server error:', error.response.data);
      }
      
      if (error.response.status === 401) {
        // Redirect to login if unauthorized
        if (window.location.pathname !== '/login') {
          console.error('Unauthorized access');
          localStorage.removeItem('token');
          // Avoid redirecting in an infinite loop
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      // Request was made but no response received - server is likely down
      console.error('Network error, no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Function to check server connection
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    await api.get('/api/health');
    isServerConnected = true;
    lastConnectionCheck = Date.now();
    return true;
  } catch (error) {
    isServerConnected = false;
    lastConnectionCheck = Date.now();
    return false;
  }
};

// Reset server connection status (useful when user manually retries)
export const resetServerConnectionStatus = () => {
  isServerConnected = true;
  lastConnectionCheck = 0;
};

// Dashboard API functions
export const dashboardService = {
  getData: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/api/dashboard');
    return response.data;
  },
  resetData: async (): Promise<{success: boolean; message: string}> => {
    const response = await api.post<{success: boolean; message: string}>('/api/dashboard/reset');
    return response.data;
  }
};

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
    const response = await api.get<Device[]>('/api/devices');
    return response.data as Device[];
  },
  getById: async (id: number): Promise<Device> => {
    const response = await api.get<Device>(`/api/devices/${id}`);
    return response.data as Device;
  },
  create: async (device: Partial<Device>): Promise<Device> => {
    const response = await api.post<Device>('/api/devices', device);
    return response.data as Device;
  },
  update: async (id: number, device: Partial<Device>): Promise<Device> => {
    const response = await api.put<Device>(`/api/devices/${id}`, device);
    return response.data as Device;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/devices/${id}`);
  },
};

// Parking Sessions API
export const parkingSessionService = {
  getAll: async (): Promise<ParkingSession[]> => {
    const response = await api.get<{data: ParkingSession[]}>('/api/parking-sessions');
    return response.data.data as ParkingSession[];
  },
  getById: async (id: number): Promise<ParkingSession> => {
    const response = await api.get<ParkingSession>(`/api/parking-sessions/${id}`);
    return response.data as ParkingSession;
  },
  update: async (id: number, data: Partial<ParkingSession>): Promise<ParkingSession> => {
    const response = await api.put<ParkingSession>(`/api/parking-sessions/${id}`, data);
    return response.data as ParkingSession;
  },
  complete: async (id: number): Promise<ParkingSession> => {
    const response = await api.post<ParkingSession>(`/api/parking-sessions/${id}/complete`);
    return response.data as ParkingSession;
  }
};

// Gates API
export const gateService = {
  getAll: async (): Promise<Gate[]> => {
    const response = await api.get<Gate[]>('/api/gates');
    return response.data as Gate[];
  },
  getById: async (id: number): Promise<Gate> => {
    const response = await api.get<Gate>(`/api/gates/${id}`);
    return response.data as Gate;
  },
  create: async (gate: Partial<Gate>): Promise<Gate> => {
    const response = await api.post<Gate>('/api/gates', gate);
    return response.data as Gate;
  },
  update: async (id: number, gate: Partial<Gate>): Promise<Gate> => {
    const response = await api.put<Gate>(`/api/gates/${id}`, gate);
    return response.data as Gate;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/gates/${id}`);
  },
  changeStatus: async (id: number, status: string): Promise<Gate> => {
    const response = await api.post<Gate>(`/api/gates/${id}/status`, { status });
    return response.data as Gate;
  },
};

// Parking Rates API
export const parkingRateService = {
  getAll: async (): Promise<ParkingRate[]> => {
    const response = await api.get<ParkingRate[]>('/api/parking-rates');
    return response.data as ParkingRate[];
  },
  getById: async (id: number): Promise<ParkingRate> => {
    const response = await api.get<ParkingRate>(`/api/parking-rates/${id}`);
    return response.data as ParkingRate;
  },
  create: async (rate: Partial<ParkingRate>): Promise<ParkingRate> => {
    try {
      const response = await api.post<ParkingRate>('/api/parking-rates', rate);
      return response.data as ParkingRate;
    } catch (error: any) {
      console.error('Error creating parking rate:', error);
      // Format the error message for better handling in the component
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          throw new Error(
            Array.isArray(error.response.data.message) 
              ? error.response.data.message.join(', ') 
              : error.response.data.message
          );
        } else if (error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  },
  update: async (id: number, rate: Partial<ParkingRate>): Promise<ParkingRate> => {
    try {
      // Ensure numeric fields are properly parsed as numbers
      const formattedRate = {
        ...rate,
        baseRate: rate.baseRate ? Number(rate.baseRate) : 0,
        hourlyRate: rate.hourlyRate ? Number(rate.hourlyRate) : 0,
        maxDailyRate: rate.maxDailyRate ? Number(rate.maxDailyRate) : 0
      };
      
      const response = await api.put<ParkingRate>(`/api/parking-rates/${id}`, formattedRate);
      return response.data as ParkingRate;
    } catch (error: any) {
      console.error('Error updating parking rate:', error);
      // Format the error message for better handling in the component
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          throw new Error(
            Array.isArray(error.response.data.message) 
              ? error.response.data.message.join(', ') 
              : error.response.data.message
          );
        } else if (error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  },
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/parking-rates/${id}`);
    } catch (error) {
      console.error('Error deleting parking rate:', error);
      throw error;
    }
  }
};

// Memberships API
export const membershipService = {
  getAll: async (): Promise<Membership[]> => {
    const response = await api.get<Membership[]>('/api/memberships');
    return response.data as Membership[];
  },
  getById: async (id: number): Promise<Membership> => {
    const response = await api.get<Membership>(`/api/memberships/${id}`);
    return response.data as Membership;
  },
  create: async (membership: Partial<Membership>): Promise<Membership> => {
    const response = await api.post<Membership>('/api/memberships', membership);
    return response.data as Membership;
  },
  update: async (id: number, membership: Partial<Membership>): Promise<Membership> => {
    const response = await api.put<Membership>(`/api/memberships/${id}`, membership);
    return response.data as Membership;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/memberships/${id}`);
  }
};

// Shifts API
export const shiftService = {
  getAll: async (): Promise<OperatorShift[]> => {
    const response = await api.get<OperatorShift[]>('/api/shifts');
    return response.data as OperatorShift[];
  },
  getById: async (id: number): Promise<OperatorShift> => {
    const response = await api.get<OperatorShift>(`/api/shifts/${id}`);
    return response.data as OperatorShift;
  },
  create: async (shift: Partial<OperatorShift>): Promise<OperatorShift> => {
    const response = await api.post<OperatorShift>('/api/shifts', shift);
    return response.data as OperatorShift;
  },
  update: async (id: number, shift: Partial<OperatorShift>): Promise<OperatorShift> => {
    const response = await api.put<OperatorShift>(`/api/shifts/${id}`, shift);
    return response.data as OperatorShift;
  },
  complete: async (id: number): Promise<OperatorShift> => {
    const response = await api.post<OperatorShift>(`/api/shifts/${id}/complete`);
    return response.data as OperatorShift;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/shifts/${id}`);
  }
};

// Settings API
export const settingsService = {
  // System settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await api.get<SystemSettings>('/api/settings/system');
    return response.data as SystemSettings;
  },
  updateSystemSettings: async (data: SystemSettings): Promise<SystemSettings> => {
    const response = await api.put<SystemSettings>('/api/settings/system', data);
    return response.data as SystemSettings;
  },
  
  // Language settings
  getLanguageSettings: async (): Promise<LanguageSettings> => {
    const response = await api.get<LanguageSettings>('/api/settings/language');
    return response.data as LanguageSettings;
  },
  updateLanguageSettings: async (data: Partial<LanguageSettings>): Promise<LanguageSettings> => {
    const response = await api.put<LanguageSettings>('/api/settings/language', data);
    return response.data as LanguageSettings;
  },
  
  // Backup settings
  getBackupSettings: async (): Promise<BackupSettings> => {
    const response = await api.get<BackupSettings>('/api/settings/backup');
    return response.data as BackupSettings;
  },
  updateBackupSettings: async (data: BackupSettings): Promise<BackupSettings> => {
    const response = await api.put<BackupSettings>('/api/settings/backup', data);
    return response.data as BackupSettings;
  },
  triggerBackup: async (): Promise<{success: boolean; message: string}> => {
    const response = await api.post<{success: boolean; message: string}>('/api/settings/backup/trigger');
    return response.data;
  }
};

// Authentication API
export const authService = {
  login: async (username: string, password: string): Promise<{token: string; user: any}> => {
    const response = await api.post<{token: string; user: any}>('/api/auth/login', { username, password });
    return response.data;
  },
  register: async (userData: any): Promise<{token: string; user: any}> => {
    const response = await api.post<{token: string; user: any}>('/api/auth/register', userData);
    return response.data;
  },
  checkAuth: async (): Promise<{isAuthenticated: boolean; user?: any}> => {
    try {
      const response = await api.get<{user: any}>('/api/auth/me');
      return { isAuthenticated: true, user: response.data.user };
    } catch (error) {
      return { isAuthenticated: false };
    }
  },
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  }
};

// User management API
export const userService = {
  getUsers: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/api/users');
    return response.data;
  },
  getUser: async (id: number): Promise<any> => {
    const response = await api.get<any>(`/api/users/${id}`);
    return response.data;
  },
  createUser: async (userData: any): Promise<any> => {
    const response = await api.post<any>('/api/users', userData);
    return response.data;
  },
  updateUser: async (id: number, userData: any): Promise<any> => {
    const response = await api.put<any>(`/api/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
  toggleUserStatus: async (id: number): Promise<any> => {
    const response = await api.patch<any>(`/api/users/${id}/toggle-status`);
    return response.data;
  }
};

export default api; 