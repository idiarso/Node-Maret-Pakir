import { EventEmitter } from 'events';
import { SerialPort, SerialPortOpenOptions } from 'serialport';
import { Gpio } from 'onoff';
import { createWorker } from 'tesseract.js';
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
    HardwareEvent,
    ErrorEvent,
    ScannerDataEvent,
    TriggerEvent
} from './hardware.types';
import { HardwareEvent as BaseHardwareEvent, ErrorEvent as BaseErrorEvent, ScannerDataEvent as BaseScannerDataEvent, TriggerEvent as BaseTriggerEvent } from './hardware.events';

export { HardwareConfig } from './hardware.types';

export class HardwareManager extends EventEmitter implements HardwareManager {
    private camera: Camera | null = null;
    private printer: SerialPort | null = null;
    private gate: Gpio | null = null;
    private scanner: SerialPort | null = null;
    private trigger: Gpio | null = null;
    private readonly config: HardwareConfig;
    private worker: any = null;

    constructor(config: HardwareConfig) {
        super();
        this.config = config;
    }

    private createEvent(): HardwareEvent {
        return {
            type: 'hardware',
            source: 'hardware-manager',
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
        await this.handleError(error);
    }

    private handleGateError = async (error: Error): Promise<void> => {
        await this.handleError(error);
    }

    private handleScannerData = async (data: string): Promise<void> => {
        this.emit('scannerData', this.createScannerDataEvent(data));
    }

    private handleTriggerChange = async (err: Error | null, value: number): Promise<void> => {
        if (err) {
            await this.handleError(err);
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

    async captureImage(): Promise<Buffer> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized');
        }
        try {
            return await this.camera.capture();
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async recognizePlate(image: Buffer): Promise<{ data: { text: string } }> {
        if (!this.worker) {
            this.worker = await createWorker();
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');
        }
        return await this.worker.recognize(image);
    }

    async initializePrinter(): Promise<void> {
        try {
            const port = new SerialPort({
                path: this.config.printer.port,
                baudRate: this.config.printer.baudRate
            });
            this.printer = port;
            this.emit('printerReady', this.createEvent());
        } catch (error: unknown) {
            await this.handlePrinterError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async printTicket(ticket: TicketData): Promise<void> {
        if (!this.printer) {
            throw new Error('Printer not initialized');
        }

        const ticketData = `
TICKET PARKIR
-------------
Barcode: ${ticket.barcode}
Plat: ${ticket.plateNumber}
Waktu: ${ticket.entryTime.toLocaleString()}
Tipe: ${ticket.vehicleType}
Operator: ${ticket.operatorId}
-------------
        `;

        await new Promise<void>((resolve, reject) => {
            this.printer!.write(ticketData, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    async initializeGate(): Promise<void> {
        try {
            this.gate = new Gpio(this.config.gate.pin, 'out');
            this.emit('gateReady', this.createEvent());
        } catch (error: unknown) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async openGate(): Promise<void> {
        if (!this.gate) {
            throw new HardwareError('Gate not initialized');
        }
        try {
            await new Promise<void>((resolve, reject) => {
                this.gate!.write(1, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            await new Promise(resolve => setTimeout(resolve, this.config.gate.openDelay));
            this.emit('gateOpened', this.createEvent());
        } catch (error: unknown) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async closeGate(): Promise<void> {
        if (!this.gate) {
            throw new HardwareError('Gate not initialized');
        }
        try {
            await new Promise<void>((resolve, reject) => {
                this.gate!.write(0, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            await new Promise(resolve => setTimeout(resolve, this.config.gate.closeDelay));
            this.emit('gateClosed', this.createEvent());
        } catch (error: unknown) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async initializeScanner(): Promise<void> {
        try {
            const port = new SerialPort({
                path: this.config.scanner.port,
                baudRate: this.config.scanner.baudRate
            });
            this.scanner = port;
            this.emit('scannerReady', this.createEvent());
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async initializeTrigger(): Promise<void> {
        try {
            this.trigger = new Gpio(this.config.trigger.pin, 'in');
            this.trigger.read(this.handleTriggerChange);
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

    async startCameraStream(): Promise<void> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized');
        }
        try {
            await this.camera.start();
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async stopCameraStream(): Promise<void> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized');
        }
        try {
            await this.camera.stop();
        } catch (error: unknown) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    async startScanner(): Promise<void> {
        if (!this.scanner) {
            throw new HardwareError('Scanner not initialized');
        }
        // Implementation here
    }

    dispose(): void {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.printer) {
            this.printer.close();
        }
        if (this.gate) {
            this.gate.unexport();
        }
        if (this.scanner) {
            this.scanner.close();
        }
        if (this.trigger) {
            this.trigger.unexport();
        }
        if (this.worker) {
            this.worker.terminate();
        }
    }
} 