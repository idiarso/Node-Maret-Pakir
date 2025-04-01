import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import { ExitTicketController } from '../controllers/TicketController';
import { BarcodeScannerService } from '../services/ScannerService';
import { ReceiptPrinterService } from '../services/PrinterService';
import { PostgreSQLDatabaseService } from '../services/DatabaseService';
import { ArduinoGateController } from '../services/GateController';
import { LocalWebSocketClient } from '../services/WebSocketClient';

let mainWindow: BrowserWindow | null = null;
let ticketController: ExitTicketController;
let wsClient: LocalWebSocketClient;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// Initialize hardware and services
async function initializeServices() {
  // Initialize hardware services
  const scannerService = new BarcodeScannerService();
  scannerService.initialize({
    type: 'barcode',
    port: 'COM1' // Sesuaikan dengan port scanner
  });

  const printerService = new ReceiptPrinterService();
  printerService.initialize({
    type: 'thermal',
    port: 'COM2' // Sesuaikan dengan port printer
  });

  const databaseService = new PostgreSQLDatabaseService();
  databaseService.initialize({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'parking_system1',
    user: 'postgres',
    password: 'postgres',
    ssl: false
  });

  const gateController = new ArduinoGateController();
  gateController.initialize({
    type: 'arduino',
    port: 'COM7', // Port Arduino UNO
    model: 'UNO'
  });

  // Initialize WebSocket client for camera IP
  wsClient = new LocalWebSocketClient();
  wsClient.initialize({
    network: {
      serverIp: '192.168.2.20',
      serverPort: 8080,
      clientIp: '192.168.2.21',
      clientPort: 8081
    }
  });

  ticketController = new ExitTicketController(
    scannerService,
    printerService,
    databaseService,
    gateController,
    wsClient
  );
}

function handleWebSocketMessage(message: any) {
  if (message.event === 'ticket:request') {
    mainWindow?.webContents.send('ticket:request', message.data);
  }
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('scan-ticket', async () => {
  try {
    const result = await ticketController.scanTicket();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error scanning ticket:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('process-payment', async (_: IpcMainInvokeEvent, ticketId: string) => {
  try {
    const result = await ticketController.processPayment(ticketId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('get-status', async () => {
  return { status: 'ready' };
}); 