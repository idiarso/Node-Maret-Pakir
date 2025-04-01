import { HardwareManager } from './hardware.types';

export interface HardwareEvent {
    context: HardwareManager;
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
    'error': (event: ErrorEvent) => void;
    'cameraReady': (event: HardwareEvent) => void;
    'printerReady': (event: HardwareEvent) => void;
    'gateReady': (event: HardwareEvent) => void;
    'scannerReady': (event: HardwareEvent) => void;
    'triggerReady': (event: HardwareEvent) => void;
    'scannerData': (event: ScannerDataEvent) => void;
    'trigger': (event: TriggerEvent) => void;
} 