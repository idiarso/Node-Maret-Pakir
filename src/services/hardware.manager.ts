import { SerialPort } from 'serialport';
import { EventEmitter } from 'events';

export interface PrinterConfig {
  port: string;
  baudRate: number;
}

export interface GateConfig {
  port: string;
  baudRate: number;
}

export class HardwareManager extends EventEmitter {
  private printerPort: SerialPort | null = null;
  private gatePort: SerialPort | null = null;

  constructor(
    private readonly printerConfig: PrinterConfig,
    private readonly gateConfig: GateConfig
  ) {
    super();
    this.initializePrinter();
    this.initializeGate();
  }

  private async initializePrinter(): Promise<void> {
    try {
      this.printerPort = new SerialPort({
        path: this.printerConfig.port,
        baudRate: this.printerConfig.baudRate
      });

      this.printerPort.on('error', (error) => {
        console.error('Printer error:', error);
        this.emit('printerError', error);
      });

      this.printerPort.on('open', () => {
        console.log('Printer connection established');
        this.emit('printerConnected');
      });
    } catch (error) {
      console.error('Failed to initialize printer:', error);
      this.emit('printerError', error);
    }
  }

  private async initializeGate(): Promise<void> {
    try {
      this.gatePort = new SerialPort({
        path: this.gateConfig.port,
        baudRate: this.gateConfig.baudRate
      });

      this.gatePort.on('error', (error) => {
        console.error('Gate error:', error);
        this.emit('gateError', error);
      });

      this.gatePort.on('open', () => {
        console.log('Gate connection established');
        this.emit('gateConnected');
      });
    } catch (error) {
      console.error('Failed to initialize gate:', error);
      this.emit('gateError', error);
    }
  }

  public async printTicket(ticketData: {
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: Date;
  }): Promise<void> {
    if (!this.printerPort) {
      throw new Error('Printer not initialized');
    }

    const printData = this.formatTicket(ticketData);
    
    return new Promise((resolve, reject) => {
      this.printerPort!.write(printData, (error) => {
        if (error) {
          console.error('Failed to print ticket:', error);
          reject(error);
        } else {
          console.log('Ticket printed successfully');
          resolve();
        }
      });
    });
  }

  private formatTicket(ticketData: {
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: Date;
  }): Buffer {
    // ESC/POS commands for ticket formatting
    const ESC = 0x1B;
    const GS = 0x1D;

    const commands = [
      // Initialize printer
      Buffer.from([ESC, 0x40]),
      
      // Center align
      Buffer.from([ESC, 0x61, 0x01]),
      
      // Large text for header
      Buffer.from([ESC, 0x21, 0x10]),
      Buffer.from('PARKING TICKET\n\n'),
      
      // Normal text
      Buffer.from([ESC, 0x21, 0x00]),
      Buffer.from(`Date: ${ticketData.entryTime.toLocaleString()}\n`),
      Buffer.from(`Plate: ${ticketData.plateNumber}\n`),
      Buffer.from(`Type: ${ticketData.vehicleType}\n\n`),
      
      // Print barcode
      Buffer.from([GS, 0x6B, 0x04]),  // Select barcode type (CODE39)
      Buffer.from(ticketData.barcode),
      Buffer.from([0x00]),  // Null terminator
      
      // Feed and cut
      Buffer.from([ESC, 0x64, 0x05]),  // Feed 5 lines
      Buffer.from([GS, 0x56, 0x00])    // Full cut
    ];

    return Buffer.concat(commands);
  }

  public async openGate(): Promise<void> {
    if (!this.gatePort) {
      throw new Error('Gate not initialized');
    }

    return new Promise((resolve, reject) => {
      // Send command to open gate (example: 0x01 for open)
      this.gatePort!.write([0x01], (error) => {
        if (error) {
          console.error('Failed to open gate:', error);
          reject(error);
        } else {
          console.log('Gate opened successfully');
          resolve();
        }
      });
    });
  }

  public async closeGate(): Promise<void> {
    if (!this.gatePort) {
      throw new Error('Gate not initialized');
    }

    return new Promise((resolve, reject) => {
      // Send command to close gate (example: 0x02 for close)
      this.gatePort!.write([0x02], (error) => {
        if (error) {
          console.error('Failed to close gate:', error);
          reject(error);
        } else {
          console.log('Gate closed successfully');
          resolve();
        }
      });
    });
  }

  public dispose(): void {
    if (this.printerPort) {
      this.printerPort.close();
    }
    if (this.gatePort) {
      this.gatePort.close();
    }
  }
} 