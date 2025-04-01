import { SerialPort } from 'serialport';
import { EventEmitter } from 'events';

export class GateController extends EventEmitter {
    private port: SerialPort | null = null;
    private isOpen = false;

    constructor(private readonly portName: string) {
        super();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            this.port = new SerialPort({
                path: this.portName,
                baudRate: 9600
            });

            this.port.on('open', () => {
                console.log('Gate controller connected');
                this.emit('ready');
            });

            this.port.on('data', (data) => {
                const message = data.toString().trim();
                this.handleMessage(message);
            });

            this.port.on('error', (error) => {
                console.error('Gate controller error:', error);
                this.emit('error', error);
            });
        } catch (error) {
            console.error('Failed to initialize gate controller:', error);
            throw error;
        }
    }

    private handleMessage(message: string): void {
        if (message === 'STATUS:READY') {
            this.emit('ready');
        } else if (message === 'STATUS:GATE_OPENED') {
            this.isOpen = true;
            this.emit('gateOpened');
        } else if (message === 'STATUS:GATE_CLOSED') {
            this.isOpen = false;
            this.emit('gateClosed');
        }
    }

    async openGate(): Promise<void> {
        if (!this.port || this.isOpen) return;

        return new Promise((resolve, reject) => {
            this.port!.write('OPEN_GATE\n', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    async closeGate(): Promise<void> {
        if (!this.port || !this.isOpen) return;

        return new Promise((resolve, reject) => {
            this.port!.write('CLOSE_GATE\n', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    async dispose(): Promise<void> {
        if (this.port) {
            await this.closeGate();
            this.port.close();
            this.port = null;
        }
    }
} 