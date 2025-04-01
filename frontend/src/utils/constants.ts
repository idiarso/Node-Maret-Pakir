// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
export const API_TIMEOUT = 30000;

// Authentication
export const TOKEN_KEY = 'token';
export const AUTH_HEADER = 'Authorization';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Vehicle Types
export const VEHICLE_TYPES = ['car', 'motorcycle', 'truck'] as const;
export type VehicleType = typeof VEHICLE_TYPES[number];

// Payment Status
export const PAYMENT_STATUS = ['pending', 'paid', 'failed'] as const;
export type PaymentStatus = typeof PAYMENT_STATUS[number];

// User Roles
export const USER_ROLES = ['admin', 'operator', 'cashier'] as const;
export type UserRole = typeof USER_ROLES[number];

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ENTRY: '/entry',
  EXIT: '/exit',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export default {
  API_BASE_URL,
  API_TIMEOUT,
  TOKEN_KEY,
  AUTH_HEADER,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  VEHICLE_TYPES,
  PAYMENT_STATUS,
  USER_ROLES,
  ROUTES,
}; 