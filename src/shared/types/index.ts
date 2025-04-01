// Vehicle types
export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  entryTime: Date;
  exitTime?: Date;
  parkingFee?: number;
  paymentStatus: PaymentStatus;
  entryImage?: string;
  exitImage?: string;
  ticketNumber: string;
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED'
}

// WebSocket message types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
  source: string;
}

export enum WebSocketMessageType {
  VEHICLE_ENTRY = 'VEHICLE_ENTRY',
  VEHICLE_EXIT = 'VEHICLE_EXIT',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  GATE_STATUS_CHANGED = 'GATE_STATUS_CHANGED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

// Hardware status types
export interface GateStatus {
  isOpen: boolean;
  lastOperation: Date;
  operatedBy: string;
  deviceId: string;
}

export interface HardwareStatus {
  deviceType: HardwareDeviceType;
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastChecked: Date;
  errorMessage?: string;
}

export enum HardwareDeviceType {
  GATE = 'GATE',
  CAMERA = 'CAMERA',
  PRINTER = 'PRINTER',
  BARCODE_SCANNER = 'BARCODE_SCANNER'
}

// User types
export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERATOR = 'OPERATOR',
  TECHNICIAN = 'TECHNICIAN'
} 