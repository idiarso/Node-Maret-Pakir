import { HardwareStatus, GateStatus } from '../../shared/types';

export interface TicketData {
  ticketId: string;
  timestamp: string;
  vehicleType: string;
  plateNumber?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  ticketNumber: string;
  entryTime: Date;
  exitTime: Date;
  duration: string;
  amount: number;
  paymentMethod: string;
  operatorName: string;
}

export interface IHardwareManager {
  openGate(isEntry: boolean): Promise<void>;
  closeGate(isEntry: boolean): Promise<void>;
  getGateStatus(): Promise<GateStatus>;
  captureImage(isEntry: boolean): Promise<string>;
  printTicket(isEntry: boolean, ticketData: TicketData): Promise<void>;
  getPrinterStatus(): Promise<HardwareStatus>;
  getStatus(): Promise<HardwareStatus>;
  cleanup(): Promise<void>;
} 