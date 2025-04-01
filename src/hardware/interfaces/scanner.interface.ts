import { SerialPort } from 'serialport';
import { EventEmitter } from 'events';

export interface ScannerConfig {
  port: string;
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  triggerCommand?: number[];
}

export interface ScanResult {
  barcode: string;
  type?: string;
  timestamp: number;
}

export class BarcodeScanner extends EventEmitter {
  private port: SerialPort | null = null;
  private buffer = '';
  private readonly defaultTriggerCommand = [0x1B, 0x74]; // Example trigger command

  constructor(private readonly config: ScannerConfig) {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.port = new SerialPort({
        path: this.config.port,
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits || 8,
        stopBits: this.config.stopBits || 1,
        parity: this.config.parity || 'none',
        autoOpen: false
      });

      this.port.on('error', (error) => {
        this.emit('error', error);
      });

      this.port.on('data', (data) => {
        this.handleData(data);
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

  private handleData(data: Buffer): void {
    // Convert buffer to string and append to existing buffer
    this.buffer += data.toString();

    // Check for termination character (usually CR or LF)
    const endIndex = this.buffer.indexOf('\r');
    if (endIndex !== -1) {
      const barcode = this.buffer.substring(0, endIndex).trim();
      this.buffer = this.buffer.substring(endIndex + 1);

      if (barcode) {
        const result: ScanResult = {
          barcode,
          timestamp: Date.now()
        };
        this.emit('scan', result);
      }
    }
  }

  public async trigger(): Promise<void> {
    if (!this.port) {
      throw new Error('Scanner not initialized');
    }

    return new Promise((resolve, reject) => {
      const command = this.config.triggerCommand || this.defaultTriggerCommand;
      this.port!.write(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public async startContinuousScan(interval = 1000): Promise<void> {
    if (!this.port) {
      throw new Error('Scanner not initialized');
    }

    const scan = async () => {
      try {
        await this.trigger();
        setTimeout(scan, interval);
      } catch (error) {
        this.emit('error', error);
      }
    };

    scan();
  }

  public stopContinuousScan(): void {
    // Implementation depends on the specific scanner model
    // Some scanners might need a special command to stop continuous scanning
  }

  public dispose(): void {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
} 