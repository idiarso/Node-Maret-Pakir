import { Request, RequestHandler } from 'express';

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  CARD = 'CARD',
  EWALLET = 'EWALLET'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export enum HardwareDeviceType {
  GATE = 'GATE',
  CAMERA = 'CAMERA',
  PRINTER = 'PRINTER',
  SCANNER = 'SCANNER'
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface HardwareStatus {
  deviceType: HardwareDeviceType;
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastChecked: Date;
  error?: string;
}

export interface GateDeviceStatus {
  isOpen: boolean;
  lastOperation: Date;
  operatedBy: string;
  deviceId: string;
}

export interface GateStatus {
  entry: GateDeviceStatus;
  exit: GateDeviceStatus;
}

export interface ParkingTicket {
  ticketNumber: string;
  entryTime: Date;
  vehicleType: VehicleType;
  entryImagePath: string;
  operatorId: number;
}

export interface ParkingFee {
  vehicleId: number;
  entryTime: Date;
  exitTime: Date;
  duration: number; // in minutes
  baseRate: number;
  additionalFees: number;
  totalAmount: number;
  currency: string;
}

export interface PaymentTransaction {
  id: number;
  parkingFeeId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: number;
  transactionId: number;
  vehiclePlate: string;
  entryTime: Date;
  exitTime: Date;
  duration: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  operatorId: number;
  createdAt: Date;
}

export interface WebSocketMessage {
  type: 'VEHICLE_ENTRY' | 'VEHICLE_EXIT' | 'PAYMENT_COMPLETED' | 'GATE_STATUS_CHANGED' | 'SYSTEM_ALERT';
  payload: any;
  timestamp: string;
  source: string;
}

export interface TokenPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

export type AuthenticatedRequestHandler = RequestHandler<
  any,
  any,
  any,
  any,
  { user: TokenPayload }
>;

export interface MessageResponse {
  message: string;
  success: boolean;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketData {
  id: number;
  barcode: string;
  plateNumber: string;
  entryTime: Date;
  exitTime?: Date;
  vehicleTypeId: number;
  operatorId: number;
  status: TicketStatus;
  notes?: string;
}

export interface VehicleTypeData {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface PaymentData {
  id: number;
  ticketId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  operatorId: number;
  notes?: string;
}

export interface UserData {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string[];
  };
}

export interface LanguageSettings {
  id?: number;
  defaultLanguage: string;
  availableLanguages: string[];
  translations: {
    [key: string]: {
      [language: string]: string;
    };
  };
  updatedAt?: Date;
  createdAt?: Date;
} 