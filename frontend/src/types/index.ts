import { VehicleType, PaymentStatus, UserRole } from '../utils/constants';

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  username: string;
  password?: string;
  name: string;
  role: UserRole;
}

// Vehicle types
export interface Vehicle {
  id: number;
  plateNumber: string;
  type: VehicleType;
  ownerName: string;
  ownerContact?: string;
  registrationDate: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleInput {
  plateNumber: string;
  type: VehicleType;
  notes?: string;
}

// Parking session types
export interface ParkingSession {
  id: number;
  vehicleId: number;
  parkingAreaId: number;
  entryTime: Date;
  exitTime?: Date;
  entryGateId?: number;
  exitGateId?: number;
  entryOperatorId?: number;
  exitOperatorId?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingSessionInput {
  vehicleId: string;
  exitTime?: string;
}

// Payment types
export interface Payment {
  id: number;
  parkingFeeId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentTime?: Date;
  operatorId?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInput {
  parkingSessionId: string;
  amount: number;
  method: 'cash' | 'card' | 'ewallet';
}

// Report types
export interface ReportFilter {
  startDate: string;
  endDate: string;
  vehicleType?: VehicleType;
  paymentStatus?: PaymentStatus;
}

export interface ReportSummary {
  totalVehicles: number;
  totalIncome: number;
  averageDuration: number;
  vehicleTypeDistribution: Record<VehicleType, number>;
  paymentMethodDistribution: Record<string, number>;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string>;
}

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_PAYMENT';
export type DeviceType = 'PRINTER' | 'SCANNER' | 'GATE' | 'ARDUINO' | 'LOOP_DETECTOR';
export type DeviceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';
export type GateStatus = 'OPEN' | 'CLOSED' | 'ERROR';
export type NotificationType = 'SYSTEM' | 'ERROR' | 'WARNING' | 'INFO';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
export type LogType = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ParkingArea {
  id: number;
  name: string;
  capacity: number;
  occupied: number;
  vehicleType?: VehicleType;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: number;
  vehicleId: number;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: number;
  parkingSessionId: number;
  barcode: string;
  plateNumber: string;
  vehicleType: VehicleType;
  entryTime: Date;
  exitTime?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingRate {
  id: number;
  vehicleType: VehicleType;
  baseRate: number;
  hourlyRate: number;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  gracePeriod: number;
  isWeekendRate: boolean;
  isHolidayRate: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingFee {
  id: number;
  ticketId: number;
  baseRate: number;
  duration: number;
  hourlyCharges: number;
  additionalCharges: number;
  totalAmount: number;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftSummary {
  id: number;
  operatorId: number;
  shiftStart: Date;
  shiftEnd?: Date;
  totalTransactions: number;
  totalAmount: number;
  cashAmount: number;
  nonCashAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: number;
  name: string;
  type: DeviceType;
  location?: string;
  port?: string;
  ipAddress?: string;
  status: DeviceStatus;
  lastPing?: Date;
  configuration?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceHealthCheck {
  id: number;
  deviceId: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  responseTime?: number;
  createdAt: Date;
}

export interface Gate {
  id: number;
  name: string;
  location?: string;
  deviceId?: number;
  status: GateStatus;
  lastStatusChange?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GateLog {
  id: number;
  gateId: number;
  action: string;
  triggeredBy?: number;
  status: GateStatus;
  createdAt: Date;
}

export interface DeviceLog {
  id: number;
  deviceId: number;
  type: LogType;
  message: string;
  createdAt: Date;
}

export interface SystemLog {
  id: number;
  type: LogType;
  source: string;
  message: string;
  userId?: number;
  ipAddress?: string;
  createdAt: Date;
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  recipientId?: number;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSetting {
  id: number;
  key: string;
  value?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingStatistic {
  id: number;
  date: Date;
  vehicleType?: VehicleType;
  totalVehicles: number;
  totalRevenue: number;
  averageDuration: number;
  peakHour?: number;
  occupancyRate?: number;
  peakOccupancyTime?: Date;
  averageStayDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holiday {
  id: number;
  name: string;
  date: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserActivityLog {
  id: number;
  userId?: number;
  action: string;
  details?: any;
  ipAddress?: string;
  createdAt: Date;
}

export interface BackupLog {
  id: number;
  backupType: string;
  filePath: string;
  fileSize?: number;
  status?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface UserSession {
  id: number;
  userId: number;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OperatorShift {
  id: number;
  operatorId: number;
  startTime: Date;
  endTime?: Date;
  gateId?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
} 