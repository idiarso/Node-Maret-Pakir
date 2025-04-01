import { SerialPort, SerialPortOpenOptions } from 'serialport';
import { LoggerService } from '../logger.service';
import { EventEmitter } from 'events';

export interface BarcodeData {
    code: string;
    timestamp: Date;
}

export class BarcodeService extends EventEmitter {
    private static instance: BarcodeService;
    private port: SerialPort;
    private buffer: string = '';

    private constructor() {
        super();
        const portPath = process.env.BARCODE_PORT || 'COM1';
        const baudRate = process.env.BARCODE_BAUD_RATE ? parseInt(process.env.BARCODE_BAUD_RATE) : 9600;

        try {
            const options: SerialPortOpenOptions<any> = {
                path: portPath,
                baudRate: baudRate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            };

            this.port = new SerialPort(options);

            this.port.on('open', () => {
                LoggerService.info('Barcode scanner connected', { port: portPath, baudRate, context: 'BarcodeService.constructor' });
            });

            this.port.on('error', (error: Error) => {
                LoggerService.error('Barcode scanner error', { error, context: 'BarcodeService.constructor' });
                this.emit('error', error);
            });

            this.port.on('data', (data: Buffer) => {
                this.handleData(data);
            });
        } catch (error) {
            LoggerService.error('Failed to initialize barcode scanner', { error, context: 'BarcodeService.constructor' });
            throw new Error('Failed to initialize barcode scanner');
        }
    }

    public static getInstance(): BarcodeService {
        if (!BarcodeService.instance) {
            BarcodeService.instance = new BarcodeService();
        }
        return BarcodeService.instance;
    }

    private handleData(data: Buffer): void {
        try {
            // Append new data to buffer
            this.buffer += data.toString();

            // Process complete barcode data (terminated by newline or carriage return)
            const lines = this.buffer.split(/[\r\n]+/);

            // Keep the last line in buffer if it's incomplete
            this.buffer = lines.pop() || '';

            // Process complete lines
            for (const line of lines) {
                if (line.trim()) {
                    const barcodeData: BarcodeData = {
                        code: line.trim(),
                        timestamp: new Date()
                    };

                    LoggerService.info('Barcode scanned', { code: barcodeData.code, context: 'BarcodeService.handleData' });
                    this.emit('barcode', barcodeData);
                }
            }
        } catch (error: unknown) {
            LoggerService.error('Failed to process barcode data', { error, context: 'BarcodeService.handleData' });
            this.emit('error', error);
        }
    }

    public async cleanup(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.port) {
                resolve();
                return;
            }

            this.port.close((error: Error | null | undefined) => {
                if (error) {
                    LoggerService.error('Failed to close barcode scanner port', { error, context: 'BarcodeService.cleanup' });
                    reject(error);
                } else {
                    LoggerService.info('Barcode scanner disconnected', { context: 'BarcodeService.cleanup' });
                    resolve();
                }
            });
        });
    }
} 