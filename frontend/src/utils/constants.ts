// API Constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = 30000;

// Authentication
export const TOKEN_KEY = 'token';
export const AUTH_HEADER = 'Authorization';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Vehicle Types
export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  BUS = 'BUS'
}

const vehicleTypeTranslations = {
  [VehicleType.CAR]: {
    'en': 'Car',
    'id': 'Mobil'
  },
  [VehicleType.MOTORCYCLE]: {
    'en': 'Motorcycle',
    'id': 'Motor'
  },
  [VehicleType.TRUCK]: {
    'en': 'Truck',
    'id': 'Truk'
  },
  [VehicleType.VAN]: {
    'en': 'Van',
    'id': 'Van'
  },
  [VehicleType.BUS]: {
    'en': 'Bus',
    'id': 'Bus'
  }
};

// Payment Status
export const PAYMENT_STATUS = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = typeof PAYMENT_STATUS[number];

// User Roles
export const USER_ROLES = ['ADMIN', 'OPERATOR', 'USER'] as const;
export type UserRole = typeof USER_ROLES[number];

// Device Status
export const DEVICE_STATUS = ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'] as const;
export type DeviceStatus = typeof DEVICE_STATUS[number];

// Device Types
export const DEVICE_TYPES = ['GATE_CONTROLLER', 'PAYMENT_TERMINAL', 'CAMERA', 'SENSOR', 'DISPLAY'] as const;
export type DeviceType = typeof DEVICE_TYPES[number];

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PARKING_SESSIONS: '/parking-sessions',
  TICKETS: '/tickets',
  VEHICLES: '/vehicles',
  MEMBERSHIPS: '/memberships',
  PAYMENTS: '/payments',
  PARKING_AREAS: '/parking-areas',
  PARKING_RATES: '/parking-rates',
  USERS: '/users',
  DEVICES: '/devices',
  GATES: '/gates',
  REPORTS: '/reports',
  SHIFTS: '/shifts',
  SETTINGS: '/settings',
  SETTINGS_LANGUAGE: '/settings/language',
  SETTINGS_BACKUP: '/settings/backup',
  SETTINGS_SYSTEM: '/settings/system',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export default {
  API_BASE_URL,
  API_TIMEOUT,
  TOKEN_KEY,
  AUTH_HEADER,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  VEHICLE_TYPES: VehicleType,
  PAYMENT_STATUS,
  USER_ROLES,
  ROUTES,
}; 