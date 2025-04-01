import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { TicketController } from '../controllers/TicketController';
import { CameraService } from '../services/CameraService';
import { PrinterService } from '../services/PrinterService';
import { DatabaseService } from '../services/DatabaseService';
import { GateController } from '../hardware/gate/GateController';

let mainWindow: BrowserWindow | null = null;
let ticketController: TicketController;

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
    const cameraService = new CameraService();
    const printerService = new PrinterService();
    const databaseService = new DatabaseService();
    const gateController = new GateController('COM3'); // Sesuaikan dengan port Arduino

    ticketController = new TicketController(
        cameraService,
        printerService,
        databaseService,
        gateController
    );
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
ipcMain.handle('create-ticket', async () => {
    try {
        await ticketController.createTicket();
        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('Unknown error:', error);
        }
        app.quit();
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

ipcMain.handle('get-status', async () => {
    // Implementasi status check
    return { status: 'ready' };
}); 