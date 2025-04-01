import { SerialPort } from 'serialport';
import { EventEmitter } from 'events';

export interface PrinterConfig {
  port: string;
  baudRate: number;
  width?: number;
  characterSet?: string;
}

export interface PrintOptions {
  bold?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: 'normal' | 'large' | 'small';
}

export class PrinterController extends EventEmitter {
  private port: SerialPort | null = null;
  private readonly ESC = 0x1B;
  private readonly GS = 0x1D;

  constructor(private readonly config: PrinterConfig) {
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

  public async print(text: string, options: PrintOptions = {}): Promise<void> {
    if (!this.port) {
      throw new Error('Printer not initialized');
    }

    const commands = this.formatText(text, options);
    
    return new Promise((resolve, reject) => {
      this.port!.write(commands, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public async printBarcode(data: string, height = 50): Promise<void> {
    if (!this.port) {
      throw new Error('Printer not initialized');
    }

    const commands = [
      // Select barcode height
      Buffer.from([this.GS, 0x68, height]),
      // Select barcode width
      Buffer.from([this.GS, 0x77, 2]),
      // Select position of HRI characters
      Buffer.from([this.GS, 0x48, 2]),
      // Select font for HRI characters
      Buffer.from([this.GS, 0x66, 0]),
      // Print barcode
      Buffer.from([this.GS, 0x6B, 0x04]), // Select CODE39
      Buffer.from(data),
      Buffer.from([0x00]) // Null terminator
    ];

    return new Promise((resolve, reject) => {
      this.port!.write(Buffer.concat(commands), (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  public async cut(): Promise<void> {
    if (!this.port) {
      throw new Error('Printer not initialized');
    }

    const command = Buffer.from([this.GS, 0x56, 0x00]); // Full cut
    
    return new Promise((resolve, reject) => {
      this.port!.write(command, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private formatText(text: string, options: PrintOptions): Buffer {
    const commands = [
      // Initialize printer
      Buffer.from([this.ESC, 0x40])
    ];

    // Text alignment
    if (options.align) {
      const alignValue = options.align === 'center' ? 1 : options.align === 'right' ? 2 : 0;
      commands.push(Buffer.from([this.ESC, 0x61, alignValue]));
    }

    // Text size
    if (options.size) {
      const sizeValue = options.size === 'large' ? 0x10 : options.size === 'small' ? 0x01 : 0x00;
      commands.push(Buffer.from([this.ESC, 0x21, sizeValue]));
    }

    // Bold
    if (options.bold) {
      commands.push(Buffer.from([this.ESC, 0x45, 0x01]));
    }

    // Underline
    if (options.underline) {
      commands.push(Buffer.from([this.ESC, 0x2D, 0x01]));
    }

    // Add text
    commands.push(Buffer.from(text));

    // Reset formatting
    commands.push(Buffer.from([this.ESC, 0x40]));

    return Buffer.concat(commands);
  }

  public dispose(): void {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
} 