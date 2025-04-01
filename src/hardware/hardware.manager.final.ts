import { EventEmitter } from 'events';
import { Gpio } from 'onoff';
import { Camera } from './camera';
import { HardwareError } from './hardware.error';
import {
    HardwareConfig,
    TicketData,
    CameraCapabilities,
    ImageQualityStats,
    HardwareManagerEvents
} from './hardware.types';

export class HardwareManager extends EventEmitter {
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

    private emitEvent<K extends keyof HardwareManagerEvents>(
        event: K,
        ...args: Parameters<HardwareManagerEvents[K]>
    ): void {
        this.emit(event, ...args);
    }

    async initializeCamera(): Promise<void> {
        try {
            this.camera = new Camera(this.config.camera);
            await this.camera.initialize();
            this.emitEvent('cameraReady', Date.now());
        } catch (error: unknown) {
            this.emitEvent('error', HardwareError.fromError(error, 'camera'), 'camera', Date.now());
        }
    }

    async initializePrinter(): Promise<void> {
        try {
            // Initialize printer
            this.emitEvent('printerReady', Date.now());
        } catch (error: unknown) {
            this.emitEvent('error', HardwareError.fromError(error, 'printer'), 'printer', Date.now());
        }
    }

    async initializeGate(): Promise<void> {
        try {
            // Initialize gate
            this.emitEvent('gateReady', Date.now());
        } catch (error: unknown) {
            this.emitEvent('error', HardwareError.fromError(error, 'gate'), 'gate', Date.now());
        }
    }

    async initializeScanner(): Promise<void> {
        try {
            // Initialize scanner
            this.emitEvent('scannerReady', Date.now());
        } catch (error: unknown) {
            this.emitEvent('error', HardwareError.fromError(error, 'scanner'), 'scanner', Date.now());
        }
    }

    async initializeTrigger(): Promise<void> {
        try {
            this.trigger = new Gpio(this.config.trigger.pin, 'in', 'both');
            await this.trigger.watch((err, value) => {
                if (err) {
                    this.emitEvent('error', HardwareError.fromError(err, 'trigger'), 'trigger', Date.now());
                    return;
                }
                this.emitEvent('trigger', value === 1, Date.now());
            });
            this.emitEvent('triggerReady', Date.now());
        } catch (error: unknown) {
            this.emitEvent('error', HardwareError.fromError(error, 'trigger'), 'trigger', Date.now());
        }
    }

    async getCameraCapabilities(): Promise<CameraCapabilities> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized', 'camera');
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
            throw new HardwareError('Camera not initialized', 'camera');
        }
        // Simulate camera error and recovery
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async captureImage(): Promise<Buffer> {
        if (!this.camera) {
            throw new HardwareError('Camera not initialized', 'camera');
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
            throw new HardwareError('Printer not initialized', 'printer');
        }
        // Implement ticket printing
    }

    async openGate(): Promise<void> {
        if (!this.gate) {
            throw new HardwareError('Gate not initialized', 'gate');
        }
        // Implement gate opening
    }

    async closeGate(): Promise<void> {
        if (!this.gate) {
            throw new HardwareError('Gate not initialized', 'gate');
        }
        // Implement gate closing
    }

    async scanBarcode(): Promise<string> {
        if (!this.scanner) {
            throw new HardwareError('Scanner not initialized', 'scanner');
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
            this.emitEvent('error', HardwareError.fromError(error, 'dispose'), 'dispose', Date.now());
        }
    }

    on<K extends keyof HardwareManagerEvents>(
        event: K,
        listener: HardwareManagerEvents[K]
    ): this {
        return super.on(event, listener);
    }
} 