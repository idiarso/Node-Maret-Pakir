import { SerialPort } from 'serialport';

export class BarcodeScannerService {
  private port: SerialPort;
  private isConnected: boolean = false;

  constructor() {
    this.port = new SerialPort({
      path: 'COM3', // Adjust this based on your system
      baudRate: 9600,
      autoOpen: false
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.port.on('open', () => {
      console.log('Scanner connected');
      this.isConnected = true;
    });

    this.port.on('close', () => {
      console.log('Scanner disconnected');
      this.isConnected = false;
    });

    this.port.on('error', (err) => {
      console.error('Scanner error:', err);
      this.isConnected = false;
    });

    this.port.on('data', (data) => {
      const barcode = data.toString().trim();
      if (barcode) {
        this.onBarcodeScanned(barcode);
      }
    });
  }

  private onBarcodeScanned(barcode: string) {
    // Emit event or call callback
    this.emit('barcode', barcode);
  }

  connect() {
    if (!this.isConnected) {
      this.port.open((err) => {
        if (err) {
          console.error('Failed to connect to scanner:', err);
          throw err;
        }
      });
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.port.close((err) => {
        if (err) {
          console.error('Failed to disconnect scanner:', err);
          throw err;
        }
      });
    }
  }

  // Event emitter methods
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
} 