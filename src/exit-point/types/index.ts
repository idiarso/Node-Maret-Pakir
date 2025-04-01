export interface NetworkConfig {
  serverIp: string;
  serverPort: number;
  clientIp: string;
  clientPort: number;
}

export interface ServerConfig {
  network: NetworkConfig;
}

export interface Ticket {
  id: string;
  plateNumber: string;
  entryTime: Date;
  exitTime?: Date;
  fee?: number;
  status: 'active' | 'completed' | 'cancelled';
}

export interface ScannerService {
  initialize(config: any): void;
  scan(): Promise<string>;
}

export interface PrinterService {
  initialize(config: any): void;
  print(data: any): Promise<void>;
}

export interface DatabaseService {
  initialize(config: any): void;
  query(sql: string, params: any[]): Promise<any>;
  getTicket(id: string): Promise<Ticket | null>;
  updateTicket(ticket: Ticket): Promise<boolean>;
  saveTransaction(ticket: Ticket): Promise<boolean>;
  close(): Promise<void>;
}

export interface GateController {
  initialize(config: any): void;
  open(): Promise<void>;
  close(): Promise<void>;
}

export interface WebSocketClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(event: string, data: any): Promise<void>;
  on(event: string, callback: (data: any) => void): void;
}

export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
} 