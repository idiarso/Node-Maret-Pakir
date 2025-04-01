import { EventEmitter } from 'events';
import { HardwareManager } from '../hardware/hardware.manager';
import { VehicleType } from '../shared/types';

interface TicketValidationResponse {
    id: string;
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: string;
    operatorId: string;
}

export interface ParkingTicket {
    id: number;
    entryTime: Date;
    vehicleType: VehicleType;
    entryImagePath: string;
    operatorId: number;
}

export interface ExitPointConfig {
    serverUrl: string;
    operatorId: string;
    paymentMethods: string[];
    rates: {
        [key: string]: {
            hourly: number;
            daily: number;
            weekly: number;
        };
    };
}

export interface Ticket {
    id: string;
    barcode: string;
    plateNumber: string;
    vehicleType: string;
    entryTime: Date;
    operatorId: string;
}

export interface PaymentDetails {
    ticketId: string;
    amount: number;
    duration: number;
    paymentMethod: string;
    transactionId?: string;
}

interface PaymentResponse {
    transactionId: string;
    status: string;
}

export class ExitPoint extends EventEmitter {
    private ws: WebSocket | null = null;
    private currentTicket: Ticket | null = null;
    private isProcessing = false;

    constructor(
        private readonly config: ExitPointConfig,
        private readonly hardwareManager: HardwareManager
    ) {
        super();
        this.initialize();
    }

    private initialize(): void {
        this.initializeWebSocket();
        this.initializeHardware();
        this.startTimeUpdate();
    }

    private initializeWebSocket(): void {
        this.ws = new WebSocket(this.config.serverUrl);

        this.ws.onopen = () => {
            this.emit('connected');
            this.updateStatus('connected');
        };

        this.ws.onclose = () => {
            this.emit('disconnected');
            this.updateStatus('disconnected');
        };

        this.ws.onerror = (error) => {
            this.emit('error', error);
            this.updateStatus('error');
        };

        this.ws.onmessage = (event) => {
            this.handleWebSocketMessage(JSON.parse(event.data));
        };
    }

    private initializeHardware(): void {
        // Start scanner
        this.hardwareManager.startScanner(1000);

        // Listen for hardware events
        this.hardwareManager.on('barcodeScan', (result) => {
            this.handleBarcodeScan(result);
        });

        this.hardwareManager.on('gateError', (error) => {
            this.emit('error', error);
        });

        this.hardwareManager.on('printerError', (error) => {
            this.emit('error', error);
        });
    }

    private startTimeUpdate(): void {
        setInterval(() => {
            this.emit('timeUpdate', new Date());
        }, 1000);
    }

    private handleWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'GATE_STATUS':
                this.emit('gateStatusUpdate', message.data);
                break;
            case 'PRINT_STATUS':
                this.emit('printStatusUpdate', message.data);
                break;
            case 'ERROR':
                this.emit('error', message.data);
                break;
            default:
                this.emit('message', message);
        }
    }

    private handleBarcodeScan(result: { barcode: string; timestamp: number }): void {
        this.emit('barcodeScanned', result);
    }

    private updateStatus(status: 'connected' | 'disconnected' | 'error'): void {
        this.emit('statusUpdate', status);
    }

    private calculateParkingFee(entryTime: Date, vehicleType: string): number {
        const now = new Date();
        const duration = now.getTime() - entryTime.getTime();
        const hours = duration / (1000 * 60 * 60);
        const days = hours / 24;
        const weeks = days / 7;

        const rates = this.config.rates[vehicleType];
        if (!rates) {
            throw new Error(`No rates defined for vehicle type: ${vehicleType}`);
        }

        if (weeks >= 1) {
            return Math.ceil(weeks) * rates.weekly;
        } else if (days >= 1) {
            return Math.ceil(days) * rates.daily;
        } else {
            return Math.ceil(hours) * rates.hourly;
        }
    }

    // Public methods for UI interaction
    public async validateTicket(barcode: string): Promise<Ticket> {
        if (this.isProcessing) {
            throw new Error('System is processing another request');
        }

        this.isProcessing = true;

        try {
            const response = await fetch(`${this.config.serverUrl}/api/tickets/${barcode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Invalid ticket');
            }

            const data = await response.json() as TicketValidationResponse;
            
            // Validate response structure
            if (!data || !data.id || !data.barcode || !data.plateNumber || !data.vehicleType || !data.entryTime || !data.operatorId) {
                throw new Error('Invalid ticket data format');
            }

            const ticket: Ticket = {
                id: data.id,
                barcode: data.barcode,
                plateNumber: data.plateNumber,
                vehicleType: data.vehicleType,
                entryTime: new Date(data.entryTime),
                operatorId: data.operatorId
            };

            this.currentTicket = ticket;
            this.emit('ticketValidated', ticket);
            return ticket;
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    public async calculatePayment(): Promise<PaymentDetails> {
        if (!this.currentTicket) {
            throw new Error('No ticket validated');
        }

        const amount = this.calculateParkingFee(
            new Date(this.currentTicket.entryTime),
            this.currentTicket.vehicleType
        );

        const paymentDetails: PaymentDetails = {
            ticketId: this.currentTicket.id,
            amount,
            duration: Date.now() - new Date(this.currentTicket.entryTime).getTime(),
            paymentMethod: this.config.paymentMethods[0], // Default to first payment method
        };

        this.emit('paymentCalculated', paymentDetails);
        return paymentDetails;
    }

    public async processPayment(paymentDetails: PaymentDetails): Promise<void> {
        if (!this.currentTicket) {
            throw new Error('No ticket validated');
        }

        this.isProcessing = true;

        try {
            const response = await fetch(`${this.config.serverUrl}/api/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentDetails),
            });

            if (!response.ok) {
                throw new Error('Payment processing failed');
            }

            const result = await response.json() as PaymentResponse;
            
            // Validate response structure
            if (!result || !result.transactionId || !result.status) {
                throw new Error('Invalid payment response format');
            }

            paymentDetails.transactionId = result.transactionId;

            // Print receipt
            await this.hardwareManager.printTicket({
                barcode: this.currentTicket.barcode,
                plateNumber: this.currentTicket.plateNumber,
                vehicleType: this.currentTicket.vehicleType,
                entryTime: this.currentTicket.entryTime
            });

            // Open gate
            await this.hardwareManager.openGate();

            this.emit('paymentProcessed', paymentDetails);
            this.currentTicket = null;
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    public async openGate(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            await this.hardwareManager.openGate();
            this.emit('gateOpened');
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    public dispose(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.hardwareManager.dispose();
    }
} 