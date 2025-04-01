import { EventEmitter } from 'events';
import { Gpio } from 'onoff';
import { Camera } from 'camera';
import { HardwareError } from './hardware.error';
import {
    HardwareConfig,
    CameraConfig,
    PrinterConfig,
    GateConfig,
    ScannerConfig,
    TriggerConfig,
    TicketData,
    CameraCapabilities,
    ImageQualityStats,
    HardwareManagerEvents,
    HardwareManager
} from './hardware.types';
import {
    HardwareEvent,
    ErrorEvent,
    ScannerDataEvent,
    TriggerEvent
} from './hardware.events';

export class HardwareManagerImpl extends EventEmitter implements HardwareManager {
    private camera: Camera | null = null;
    private printer: any | null = null;
    private gate: any | null = null;
    private scanner: any | null = null;
    private trigger: Gpio | null = null;
    private readonly config: HardwareConfig;

    constructor(config: HardwareConfig) {
        super();
        this.config = config;
    }

    private createEvent(): HardwareEvent {
        return {
            context: this,
            timestamp: Date.now()
        };
    }

    private createErrorEvent(error: Error): ErrorEvent {
        return {
            ...this.createEvent(),
            error
        };
    }

    private createScannerDataEvent(data: string): ScannerDataEvent {
        return {
            ...this.createEvent(),
            data
        };
    }

    private createTriggerEvent(value: boolean): TriggerEvent {
        return {
            ...this.createEvent(),
            value
        };
    }

    private handleError = async (error: Error): Promise<void> => {
        this.emit('error', this.createErrorEvent(error));
    }

    private handlePrinterError = async (error: Error): Promise<void> => {
        this.emit('error', this.createErrorEvent(error));
    }

    private handleGateError = async (error: Error): Promise<void> => {
        this.emit('error', this.createErrorEvent(error));
    }

    private handleScannerData = async (data: string): Promise<void> => {
        this.emit('scannerData', this.createScannerDataEvent(data));
    }

    private handleTriggerChange = async (err: Error | null, value: number): Promise<void> => {
        if (err) {
            this.handleError(err);
            return;
        }
        this.emit('trigger', this.createTriggerEvent(value === 1));
    }

    async initializeCamera(): Promise<void> {
        try {
            this.camera = new Camera(this.config.camera);
            await this.camera.initialize();
            this.emit('cameraReady', this.createEvent());
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async initializePrinter(): Promise<void> {
        try {
            // Initialize printer
            this.emit('printerReady', this.createEvent());
        } catch (error: unknown) {
            await this.handlePrinterError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async initializeGate(): Promise<void> {
        try {
            // Initialize gate
            this.emit('gateReady', this.createEvent());
        } catch (error: unknown) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async initializeScanner(): Promise<void> {
        try {
            // Initialize scanner
            this.emit('scannerReady', this.createEvent());
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async initializeTrigger(): Promise<void> {
        try {
            this.trigger = new Gpio(this.config.trigger.pin, 'in', 'both');
            await this.trigger.watch(this.handleTriggerChange);
            this.emit('triggerReady', this.createEvent());
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async getCameraCapabilities(): Promise<CameraCapabilities> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized');
        }
        return {
            resolutions: [
                { width: 1920, height: 1080 },
                { width: 1280, height: 720 },
                { width: 640, height: 480 }
            ],
            frameRates: [30, 60, 120]
        };
    }

    async analyzeImageQuality(image: Buffer): Promise<ImageQualityStats> {
        // Implement image quality analysis
        return {
            brightness: 0.8,
            contrast: 0.7,
            blur: 0.1
        };
    }

    async simulateCameraError(): Promise<void> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized');
        }
        // Simulate camera error and recovery
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async captureImage(): Promise<Buffer> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized');
        }
        // Implement image capture
        return Buffer.from([]);
    }

    async recognizePlate(image: Buffer): Promise<string> {
        // Implement plate recognition
        return 'ABC123';
    }

    async printTicket(ticket: TicketData): Promise<void> {
        if (!this.printer) {
            throw new HardwareError('Printer not initialized');
        }
        // Implement ticket printing
    }

    async openGate(): Promise<void> {
        if (!this.gate) {
            throw new HardwareError('Gate not initialized');
        }
        // Implement gate opening
    }

    async closeGate(): Promise<void> {
        if (!this.gate) {
            throw new HardwareError('Gate not initialized');
        }
        // Implement gate closing
    }

    async scanBarcode(): Promise<string> {
        if (!this.scanner) {
            throw new HardwareError('Scanner not initialized');
        }
        // Implement barcode scanning
        return '123456789';
    }

    async dispose(): Promise<void> {
        try {
            if (this.camera) {
                await this.camera.close();
            }
            if (this.printer) {
                // Close printer connection
            }
            if (this.gate) {
                // Close gate connection
            }
            if (this.scanner) {
                // Close scanner connection
            }
            if (this.trigger) {
                await this.trigger.unexport();
            }
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
} 