import { HardwareManager, HardwareConfig } from './hardware/hardware.manager';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Tesseract from 'tesseract.js';

export interface EntryPointConfig extends HardwareConfig {
    localServerUrl: string;
    operatorId: string;
    mode: 'get-in' | 'get-out';
    defaultVehicleType?: string;
    ocrConfig?: {
        lang: string;
        oem: number;
        psm: number;
    };
    triggerConfig?: {
        type: 'pushbutton' | 'loop-detector';
        pin: number;
        debounceTime?: number;
        activeLow?: boolean;
    };
}

export interface VehicleType {
    id: string;
    name: string;
    price: number;
}

// API Response Interfaces
interface PlateRecognitionResponse {
    plateNumber: string;
}

interface TicketGenerationResponse {
    barcode: string;
}

// WebSocket Message Interfaces
interface WebSocketMessageBase {
    type: string;
    data: unknown;
}

interface GateStatusMessage extends WebSocketMessageBase {
    type: 'GATE_STATUS';
    data: {
        status: 'open' | 'closed' | 'error';
        timestamp: number;
        error?: string;
    };
}

interface PrintStatusMessage extends WebSocketMessageBase {
    type: 'PRINT_STATUS';
    data: {
        status: 'success' | 'error' | 'in_progress';
        timestamp: number;
        error?: string;
    };
}

interface ErrorMessage extends WebSocketMessageBase {
    type: 'ERROR';
    data: {
        code: string;
        message: string;
        timestamp: number;
    };
}

type WebSocketMessage = GateStatusMessage | PrintStatusMessage | ErrorMessage;

// Hardware Event Interfaces
interface BarcodeScanResult {
    barcode: string;
    timestamp: number;
    format?: string;
}

interface CameraFrame {
    image: string; // Base64 encoded image
    timestamp: number;
}

interface HardwareError {
    code: string;
    message: string;
    timestamp: number;
    device: 'camera' | 'printer' | 'gate' | 'scanner';
}

export interface TicketData {
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: Date;
    operatorId: string;
    exitTime?: Date;
    paymentAmount?: number;
}

interface LocalServerResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export class EntryPoint extends EventEmitter {
    private plateNumber: string | null = null;
    private isProcessing = false;
    private processingTimeout: NodeJS.Timeout | null = null;
    private triggerState = false;
    private lastTriggerTime = 0;
    private readonly defaultVehicleType = 'car';

    constructor(
        private readonly config: EntryPointConfig,
        private readonly hardwareManager: HardwareManager
    ) {
        super();
        this.initialize();
    }

    private initialize(): void {
        this.initializeHardware();
        this.startTimeUpdate();
        if (this.config.mode === 'get-in') {
            this.setupTrigger();
        }
    }

    private initializeHardware(): void {
        // Start camera stream for plate recognition
        this.hardwareManager.startCameraStream((image) => {
            this.emit('cameraFrame', image);
        }, 100);

        // Start scanner for barcode scanning (get-out only)
        if (this.config.mode === 'get-out') {
            this.hardwareManager.startScanner(1000);
        }

        // Set up hardware event listeners
        this.hardwareManager.on('barcodeScan', (result) => {
            if (this.config.mode === 'get-out') {
                this.handleExitScan(result.barcode);
            }
        });

        this.hardwareManager.on('gateError', (error) => {
            this.emit('error', error);
        });

        this.hardwareManager.on('printerError', (error) => {
            this.emit('error', error);
        });
    }

    private setupTrigger(): void {
        // Set up trigger monitoring
        if (this.config.triggerConfig) {
            this.startTriggerMonitoring();
        }
    }

    private startTriggerMonitoring(): void {
        // Poll trigger state every 100ms
        setInterval(() => {
            this.checkTriggerState();
        }, 100);
    }

    private checkTriggerState(): void {
        if (!this.config.triggerConfig) return;

        const now = Date.now();
        const debounceTime = this.config.triggerConfig.debounceTime || 1000;

        // Read trigger state from hardware
        const newState = this.hardwareManager.readTriggerState(this.config.triggerConfig.pin);
        const isActive = this.config.triggerConfig.activeLow ? !newState : newState;

        // Check for state change with debounce
        if (isActive !== this.triggerState && (now - this.lastTriggerTime) >= debounceTime) {
            this.triggerState = isActive;
            this.lastTriggerTime = now;

            if (isActive && !this.isProcessing) {
                this.handleEntryTrigger();
            }
        }
    }

    private startTimeUpdate(): void {
        setInterval(() => {
            this.emit('timeUpdate', new Date());
        }, 1000);
    }

    private async handleEntryTrigger(): Promise<void> {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.setProcessingTimeout();

        try {
            // Capture and recognize plate
            await this.capturePlate();
            
            // Generate and print ticket
            await this.generateTicket();
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('Unknown error during entry process'));
        } finally {
            this.clearProcessingTimeout();
            this.isProcessing = false;
        }
    }

    private setProcessingTimeout(): void {
        this.processingTimeout = setTimeout(() => {
            this.isProcessing = false;
            this.emit('error', new Error('Entry process timeout'));
        }, 30000); // 30 second timeout
    }

    private clearProcessingTimeout(): void {
        if (this.processingTimeout) {
            clearTimeout(this.processingTimeout);
            this.processingTimeout = null;
        }
    }

    private async capturePlate(): Promise<void> {
        const image = await this.hardwareManager.captureImage();
        if (!image) throw new Error('Failed to capture image');

        this.emit('plateCaptured', image);

        // Recognize plate locally using Tesseract.js
        const plateNumber = await this.recognizePlateLocally(image);
        if (!plateNumber) throw new Error('Failed to recognize plate locally');

        this.plateNumber = plateNumber;
        this.emit('plateRecognized', plateNumber);
    }

    private async recognizePlateLocally(image: string): Promise<string | null> {
        try {
            const result = await Tesseract.recognize(
                image,
                this.config.ocrConfig?.lang || 'eng',
                {
                    logger: (m) => this.emit('ocrProgress', m)
                }
            );

            // Basic plate number validation (customize based on your plate format)
            const plateNumber = result.data.text.trim().toUpperCase();
            if (/^[A-Z0-9]{5,10}$/.test(plateNumber)) {
                return plateNumber;
            }

            return null;
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('OCR failed'));
            return null;
        }
    }

    private async generateTicket(): Promise<void> {
        if (!this.plateNumber) {
            throw new Error('Missing required data for ticket generation');
        }

        const ticketData: TicketData = {
            barcode: uuidv4(),
            plateNumber: this.plateNumber,
            vehicleType: this.defaultVehicleType,
            entryTime: new Date(),
            operatorId: this.config.operatorId
        };

        try {
            // Sync to local server
            await this.syncToLocalServer('ticket', ticketData);

            // Print ticket
            await this.hardwareManager.printTicket(ticketData);

            // Open gate
            await this.hardwareManager.openGate();

            this.emit('ticketGenerated', ticketData);
            this.plateNumber = null;
        } catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('Failed to generate ticket'));
            throw error;
        }
    }

    private async handleExitScan(barcode: string): Promise<void> {
        this.emit('barcodeScanned', { barcode, timestamp: Date.now() });
    }

    private async syncToLocalServer(type: 'ticket' | 'payment', data: TicketData): Promise<void> {
        try {
            const response = await fetch(`${this.config.localServerUrl}/${type}s`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to sync ${type} to local server`);
            }

            const result = await response.json() as LocalServerResponse;
            if (!result.success) {
                throw new Error(result.error || `Failed to sync ${type}`);
            }
        } catch (error) {
            // Store failed sync in local storage for retry
            await this.storeFailedSync(type, data);
            throw error;
        }
    }

    private async storeFailedSync(type: 'ticket' | 'payment', data: TicketData): Promise<void> {
        // Implement local storage for failed syncs
        // This could be SQLite, file system, or other local storage
        // For now, we'll just emit an event
        this.emit('syncFailed', { type, data });
    }

    public dispose(): void {
        this.clearProcessingTimeout();
        this.hardwareManager.dispose();
    }
} 