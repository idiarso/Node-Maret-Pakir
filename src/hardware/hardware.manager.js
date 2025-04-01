"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardwareManager = void 0;
const events_1 = require("events");
const serialport_1 = require("serialport");
const onoff_1 = require("onoff");
const tesseract_js_1 = require("tesseract.js");
const camera_1 = require("camera");
const hardware_error_1 = require("./hardware.error");
class HardwareManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.camera = null;
        this.printer = null;
        this.gate = null;
        this.scanner = null;
        this.trigger = null;
        this.worker = null;
        this.handleError = async (error) => {
            this.emit('error', this.createErrorEvent(error));
        };
        this.handlePrinterError = async (error) => {
            await this.handleError(error);
        };
        this.handleGateError = async (error) => {
            await this.handleError(error);
        };
        this.handleScannerData = async (data) => {
            this.emit('scannerData', this.createScannerDataEvent(data));
        };
        this.handleTriggerChange = async (err, value) => {
            if (err) {
                await this.handleError(err);
                return;
            }
            this.emit('trigger', this.createTriggerEvent(value === 1));
        };
        this.config = config;
    }
    createEvent() {
        return {
            type: 'hardware',
            source: 'hardware-manager',
            timestamp: Date.now()
        };
    }
    createErrorEvent(error) {
        return {
            ...this.createEvent(),
            error
        };
    }
    createScannerDataEvent(data) {
        return {
            ...this.createEvent(),
            data
        };
    }
    createTriggerEvent(value) {
        return {
            ...this.createEvent(),
            value
        };
    }
    async initializeCamera() {
        try {
            this.camera = new camera_1.Camera(this.config.camera);
            await this.camera.initialize();
            this.emit('cameraReady', this.createEvent());
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async captureImage() {
        if (!this.camera) {
            throw new hardware_error_1.HardwareError('Camera not initialized');
        }
        try {
            return await this.camera.capture();
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async recognizePlate(image) {
        if (!this.worker) {
            this.worker = await (0, tesseract_js_1.createWorker)();
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');
        }
        return await this.worker.recognize(image);
    }
    async initializePrinter() {
        try {
            const port = new serialport_1.SerialPort({
                path: this.config.printer.port,
                baudRate: this.config.printer.baudRate
            });
            this.printer = port;
            this.emit('printerReady', this.createEvent());
        }
        catch (error) {
            await this.handlePrinterError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async printTicket(ticket) {
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
        await new Promise((resolve, reject) => {
            this.printer.write(ticketData, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
    async initializeGate() {
        try {
            this.gate = new onoff_1.Gpio(this.config.gate.pin, 'out');
            this.emit('gateReady', this.createEvent());
        }
        catch (error) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async openGate() {
        if (!this.gate) {
            throw new hardware_error_1.HardwareError('Gate not initialized');
        }
        try {
            await new Promise((resolve, reject) => {
                this.gate.write(1, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            await new Promise(resolve => setTimeout(resolve, this.config.gate.openDelay));
            this.emit('gateOpened', this.createEvent());
        }
        catch (error) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async closeGate() {
        if (!this.gate) {
            throw new hardware_error_1.HardwareError('Gate not initialized');
        }
        try {
            await new Promise((resolve, reject) => {
                this.gate.write(0, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            await new Promise(resolve => setTimeout(resolve, this.config.gate.closeDelay));
            this.emit('gateClosed', this.createEvent());
        }
        catch (error) {
            await this.handleGateError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async initializeScanner() {
        try {
            const port = new serialport_1.SerialPort({
                path: this.config.scanner.port,
                baudRate: this.config.scanner.baudRate
            });
            this.scanner = port;
            this.emit('scannerReady', this.createEvent());
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async initializeTrigger() {
        try {
            this.trigger = new onoff_1.Gpio(this.config.trigger.pin, 'in');
            this.trigger.read(this.handleTriggerChange);
            this.emit('triggerReady', this.createEvent());
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    }
    async getCameraCapabilities() {
        if (!this.camera) {
            throw new hardware_error_1.HardwareError('Camera not initialized');
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
    async analyzeImageQuality(image) {
        // Implement image quality analysis
        return {
            brightness: 0.8,
            contrast: 0.7,
            blur: 0.1
        };
    }
    async simulateCameraError() {
        if (!this.camera) {
            throw new hardware_error_1.HardwareError('Camera not initialized');
        }
        // Simulate camera error and recovery
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    async startCameraStream() {
        if (!this.camera) {
            throw new hardware_error_1.HardwareError('Camera not initialized');
        }
        try {
            await this.camera.start();
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async stopCameraStream() {
        if (!this.camera) {
            throw new hardware_error_1.HardwareError('Camera not initialized');
        }
        try {
            await this.camera.stop();
        }
        catch (error) {
            await this.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    async startScanner() {
        if (!this.scanner) {
            throw new hardware_error_1.HardwareError('Scanner not initialized');
        }
        // Implementation here
    }
    dispose() {
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
exports.HardwareManager = HardwareManager;
