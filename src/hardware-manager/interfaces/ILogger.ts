import { HardwareDeviceType } from '../../shared/types';

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum LogCategory {
  GATE_OPERATION = 'GATE_OPERATION',
  CAMERA_OPERATION = 'CAMERA_OPERATION',
  PRINTER_OPERATION = 'PRINTER_OPERATION',
  HARDWARE_STATUS = 'HARDWARE_STATUS',
  INITIALIZATION = 'INITIALIZATION',
  CLEANUP = 'CLEANUP'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  deviceType: HardwareDeviceType;
  deviceId: string;
  message: string;
  details?: Record<string, any>;
  error?: Error;
}

export interface ILogger {
  log(entry: Omit<LogEntry, 'timestamp'>): Promise<void>;
  info(category: LogCategory, deviceType: HardwareDeviceType, deviceId: string, message: string, details?: Record<string, any>): Promise<void>;
  warn(category: LogCategory, deviceType: HardwareDeviceType, deviceId: string, message: string, details?: Record<string, any>): Promise<void>;
  error(category: LogCategory, deviceType: HardwareDeviceType, deviceId: string, message: string, error: Error, details?: Record<string, any>): Promise<void>;
  debug(category: LogCategory, deviceType: HardwareDeviceType, deviceId: string, message: string, details?: Record<string, any>): Promise<void>;
  query(options: {
    startDate?: Date;
    endDate?: Date;
    level?: LogLevel;
    category?: LogCategory;
    deviceType?: HardwareDeviceType;
    deviceId?: string;
  }): Promise<LogEntry[]>;
} 