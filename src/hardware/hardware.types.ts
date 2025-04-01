import { EventEmitter } from 'events';
import { Gpio } from 'onoff';
import { Camera } from 'camera';

export interface CameraConfig {
    deviceId: string;
    resolution: {
        width: number;
        height: number;
    };
    frameRate: number;
}

export interface PrinterConfig {
    port: string;
    baudRate: number;
}

export interface GateConfig {
    pin: number;
    openDelay: number;
    closeDelay: number;
}

export interface ScannerConfig {
    port: string;
    baudRate: number;
}

export interface TriggerConfig {
    type: 'pushbutton';
    pin: number;
    debounceTime: number;
    activeLow: boolean;
}

export interface HardwareConfig {
    camera: {
        deviceId: string;
        resolution: {
            width: number;
            height: number;
        };
        frameRate: number;
    };
    printer: {
        port: string;
        baudRate: number;
    };
    gate: {
        pin: number;
        openDelay: number;
        closeDelay: number;
    };
    scanner: {
        port: string;
        baudRate: number;
    };
    trigger: {
        pin: number;
        debounceTime?: number;
        activeLow?: boolean;
    };
}

export interface TicketData {
    id: string;
    plateNumber: string;
    entryTime: Date;
    vehicleType: string;
    barcode: string;
    operatorId?: string;
}

export interface CameraCapabilities {
    resolutions: Array<{
        width: number;
        height: number;
    }>;
    frameRates: number[];
}

export interface ImageQualityStats {
    brightness: number;  // 0-1 scale
    contrast: number;    // 0-1 scale
    blur: number;       // 0-1 scale (0 = sharp, 1 = blurry)
}

export interface HardwareEvent {
    type: string;
    data?: any;
    source: string;
    timestamp: number;
}

export interface ErrorEvent extends HardwareEvent {
    error: Error;
}

export interface ScannerDataEvent extends HardwareEvent {
    data: string;
}

export interface TriggerEvent extends HardwareEvent {
    value: boolean;
}

export interface HardwareManagerEvents {
    'error': (error: Error, source: string, timestamp: number) => void;
    'cameraReady': (timestamp: number) => void;
    'printerReady': (timestamp: number) => void;
    'gateReady': (timestamp: number) => void;
    'scannerReady': (timestamp: number) => void;
    'triggerReady': (timestamp: number) => void;
    'scannerData': (data: string, timestamp: number) => void;
    'trigger': (value: boolean, timestamp: number) => void;
}

export interface HardwareManager {
    initializeCamera(): Promise<void>;
    initializePrinter(): Promise<void>;
    initializeGate(): Promise<void>;
    initializeScanner(): Promise<void>;
    initializeTrigger(): Promise<void>;
    getCameraCapabilities(): Promise<CameraCapabilities>;
    analyzeImageQuality(image: Buffer): Promise<ImageQualityStats>;
    simulateCameraError(): Promise<void>;
    captureImage(): Promise<Buffer>;
    recognizePlate(image: Buffer): Promise<string>;
    printTicket(ticket: TicketData): Promise<void>;
    openGate(): Promise<void>;
    closeGate(): Promise<void>;
    scanBarcode(): Promise<string>;
    on<K extends keyof HardwareManagerEvents>(event: K, listener: HardwareManagerEvents[K]): this;
    emit<K extends keyof HardwareManagerEvents>(event: K, ...args: Parameters<HardwareManagerEvents[K]>): boolean;
} 