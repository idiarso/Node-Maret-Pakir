// Gate interface
export interface Gate {
  id: number;
  name: string;
  location?: string;
  deviceId?: number;
  status: string;
  type?: string;
  gate_number?: string;
  description?: string;
  is_active?: boolean;
  hardware_config?: any;
  maintenance_schedule?: any;
  error_log?: any;
  lastStatusChange?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: Date;
  updated_at?: Date;
  _optimistic?: boolean;
  _error?: string;
}

// Payment interfaces
export interface Payment {
  id: number;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface PaymentFormData {
  amount: number;
  status: string;
  payment_method: string;
}

// Ticket interface
export interface Ticket {
  id: number;
  ticket_number: string;
  entry_time: Date | string;
  exit_time?: Date | string;
  status: string;
  vehicle_type: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Device interface
export interface Device {
  id: number;
  name: string;
  type: string;
  status: string;
  location?: string;
  ip_address?: string;
  port?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

// Parking Session interface
export interface ParkingSession {
  id: number;
  entry_time: Date | string;
  exit_time?: Date | string;
  vehicle_id?: number;
  parking_area_id?: number;
  ticket_id?: number;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Parking Rate interface
export interface ParkingRate {
  id: number;
  vehicle_type: string;
  base_rate: number;
  hourly_rate: number;
  daily_rate: number;
  status: string;
  effective_from?: Date | string;
  effective_to?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Membership interface
export interface Membership {
  id: number;
  vehicle_id: number;
  type: string;
  start_date: Date | string;
  end_date: Date | string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Operator Shift interface
export interface OperatorShift {
  id: number;
  operator_id: number;
  start_time: Date | string;
  end_time?: Date | string;
  gate_id?: number;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// System Settings interface
export interface SystemSettings {
  company_name: string;
  address: string;
  contact_number: string;
  email: string;
  tax_rate: number;
  currency: string;
  timezone: string;
  logo_url?: string;
  theme?: string;
}

// Language Settings interface
export interface LanguageSettings {
  default_language: string;
  available_languages: string[];
  translations?: Record<string, Record<string, string>>;
}

// Backup Settings interface
export interface BackupSettings {
  auto_backup: boolean;
  backup_frequency: string;
  backup_time: string;
  backup_location: string;
  keep_backups: number;
  last_backup?: Date | string;
}