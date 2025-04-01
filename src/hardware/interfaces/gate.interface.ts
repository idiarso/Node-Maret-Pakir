import { SerialPort } from 'serialport';
import { EventEmitter } from 'events';

export interface GateConfig {
  port: string;
  baudRate: number;
  openCommand?: number[];
  closeCommand?: number[];
  statusCommand?: number[];
  pin: number;
  activeLow?: boolean;
}

export interface GateStatus {
  isOpen: boolean;
  error?: string;
}

export class GateController extends EventEmitter {
  private port: SerialPort | null = null;
  private isOpen = false;
  private readonly defaultOpenCommand = [0x01];
  private readonly defaultCloseCommand = [0x02];
  private readonly defaultStatusCommand = [0x03];

  constructor(private readonly config: GateConfig) {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.port = new SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
        autoOpen: false
      });

      this.port.on('error', (error) => {
        this.emit('error', error);
      });

      this.port.on('data', (data) => {
        this.handleResponse(data);
      });

      await this.open();
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.port) {
        reject(new Error('Port not initialized'));
        return;
      }

      this.port.open((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private handleResponse(data: Buffer): void {
    // Example response handling - adjust based on your gate controller's protocol
    const response = data[0];
    switch (response) {
      case 0x10: // Success open
        this.isOpen = true;
        this.emit('stateChanged', { isOpen: true });
        break;
      case 0x11: // Success close
        this.isOpen = false;
        this.emit('stateChanged', { isOpen: false });
        break;
      case 0x20: // Error
        this.emit('error', new Error('Gate operation failed'));
        break;
      default:
        this.emit('data', data);
    }
  }

  public async openGate(): Promise<void> {
    if (!this.port) {
      throw new Error('Gate not initialized');
    }

    return new Promise((resolve, reject) => {
      const command = this.config.openCommand || this.defaultOpenCommand;
      this.port!.write(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public async closeGate(): Promise<void> {
    if (!this.port) {
      throw new Error('Gate not initialized');
    }

    return new Promise((resolve, reject) => {
      const command = this.config.closeCommand || this.defaultCloseCommand;
      this.port!.write(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public async getStatus(): Promise<GateStatus> {
    if (!this.port) {
      throw new Error('Gate not initialized');
    }

    return new Promise((resolve, reject) => {
      const command = this.config.statusCommand || this.defaultStatusCommand;
      this.port!.write(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ isOpen: this.isOpen });
      });
    });
  }

  public dispose(): void {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
} 