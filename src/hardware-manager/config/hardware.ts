import dotenv from 'dotenv';

dotenv.config();

export const hardwareConfig = {
  entry: {
    gatePort: process.env.ENTRY_GATE_PORT || 'COM3',
    cameraId: parseInt(process.env.ENTRY_CAMERA_ID || '0'),
    printerType: process.env.ENTRY_PRINTER_TYPE || 'EPSON',
    printerPort: process.env.ENTRY_PRINTER_PORT || 'USB',
  },
  exit: {
    gatePort: process.env.EXIT_GATE_PORT || 'COM4',
    cameraId: parseInt(process.env.EXIT_CAMERA_ID || '1'),
    printerType: process.env.EXIT_PRINTER_TYPE || 'EPSON',
    printerPort: process.env.EXIT_PRINTER_PORT || 'USB',
    scannerPort: process.env.EXIT_SCANNER_PORT || 'COM5',
  },
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
  imageStoragePath: process.env.IMAGE_STORAGE_PATH || './images',
  ticketTemplate: {
    width: 48, // characters
    qrSize: 8,  // QR code size
    font: {
      normal: 'A',
      bold: 'B',
    },
  },
}; 