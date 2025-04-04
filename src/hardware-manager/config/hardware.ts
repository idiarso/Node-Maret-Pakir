import dotenv from 'dotenv';

dotenv.config();

export const hardwareConfig = {
  entry: {
    gatePort: process.env.GATE_PORT || '/dev/ttyUSB1',
    cameraId: parseInt(process.env.ENTRY_CAMERA_ID || '0'),
    printerType: process.env.ENTRY_PRINTER_TYPE || 'EPSON',
    printerPort: process.env.PRINTER_PORT || '/dev/ttyUSB0',
  },
  exit: {
    gatePort: process.env.EXIT_GATE_PORT || '/dev/ttyUSB2',
    cameraId: parseInt(process.env.EXIT_CAMERA_ID || '1'),
    printerType: process.env.EXIT_PRINTER_TYPE || 'EPSON',
    printerPort: process.env.EXIT_PRINTER_PORT || '/dev/ttyUSB3',
    scannerPort: process.env.EXIT_SCANNER_PORT || '/dev/ttyUSB4',
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