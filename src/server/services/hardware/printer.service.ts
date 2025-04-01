import { SerialPort, SerialPortOpenOptions } from 'serialport';
import { LoggerService } from '../logger.service';
import { Ticket } from '../../entities/Ticket';
import { Payment } from '../../entities/Payment';
import { VehicleType } from '../../entities/VehicleType';

export class PrinterService {
    private static instance: PrinterService;
    private port: SerialPort;

    private constructor() {
        const portPath = process.env.PRINTER_PORT || 'COM2';
        const baudRate = process.env.PRINTER_BAUD_RATE ? parseInt(process.env.PRINTER_BAUD_RATE) : 9600;

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
                LoggerService.info('Receipt printer connected', { port: portPath, baudRate, context: 'PrinterService.constructor' });
            });

            this.port.on('error', (error: Error) => {
                LoggerService.error('Receipt printer error', { error, context: 'PrinterService.constructor' });
            });
        } catch (error) {
            LoggerService.error('Failed to initialize receipt printer', { error, context: 'PrinterService.constructor' });
            throw new Error('Failed to initialize receipt printer');
        }
    }

    public static getInstance(): PrinterService {
        if (!PrinterService.instance) {
            PrinterService.instance = new PrinterService();
        }
        return PrinterService.instance;
    }

    private async write(data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.port.write(data, (error: Error | null | undefined) => {
                if (error) {
                    LoggerService.error('Failed to write to printer', { error, context: 'PrinterService.write' });
                    reject(error);
                } else {
                    this.port.drain((error: Error | null | undefined) => {
                        if (error) {
                            LoggerService.error('Failed to drain printer buffer', { error, context: 'PrinterService.write' });
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }

    public async printTicket(ticket: Ticket, vehicleType: VehicleType): Promise<void> {
        try {
            const receipt = [
                '\x1B\x40',  // Initialize printer
                '\x1B\x61\x01',  // Center alignment
                'PARKING TICKET\n',
                '=============\n\n',
                `Ticket #: ${ticket.ticketNumber}\n`,
                `Vehicle Type: ${vehicleType.name}\n`,
                `Plate #: ${ticket.plateNumber}\n`,
                `Entry Time: ${ticket.entryTime.toLocaleString()}\n\n`,
                'Please keep this ticket safe.\n',
                'Present this ticket upon exit.\n\n',
                '\x1B\x61\x00',  // Left alignment
                `Rate: $${vehicleType.price.toFixed(2)}/hour\n\n`,
                '\x1B\x61\x01',  // Center alignment
                'Thank you for parking with us!\n\n\n\n',
                '\x1B\x69',  // Cut paper
            ].join('');

            await this.write(receipt);
            LoggerService.info('Ticket printed', { ticketNumber: ticket.ticketNumber, context: 'PrinterService.printTicket' });
        } catch (error) {
            LoggerService.error('Failed to print ticket', { error, context: 'PrinterService.printTicket' });
            throw new Error('Failed to print ticket');
        }
    }

    public async printPayment(payment: Payment, ticket: Ticket, vehicleType: VehicleType): Promise<void> {
        try {
            const parkingDuration = Math.ceil((new Date().getTime() - ticket.entryTime.getTime()) / (1000 * 60 * 60));
            
            const receipt = [
                '\x1B\x40',  // Initialize printer
                '\x1B\x61\x01',  // Center alignment
                'PARKING RECEIPT\n',
                '==============\n\n',
                `Receipt #: ${payment.id}\n`,
                `Ticket #: ${ticket.ticketNumber}\n`,
                `Vehicle Type: ${vehicleType.name}\n`,
                `Plate #: ${ticket.plateNumber}\n\n`,
                '\x1B\x61\x00',  // Left alignment
                `Entry Time: ${ticket.entryTime.toLocaleString()}\n`,
                `Exit Time: ${new Date().toLocaleString()}\n`,
                `Duration: ${parkingDuration} hour(s)\n\n`,
                `Rate: $${vehicleType.price.toFixed(2)}/hour\n`,
                `Amount: $${payment.amount.toFixed(2)}\n\n`,
                `Payment Method: ${payment.paymentMethod || 'CASH'}\n`,
                payment.transactionId ? `Transaction ID: ${payment.transactionId}\n` : '',
                '\n\x1B\x61\x01',  // Center alignment
                'Thank you for parking with us!\n\n\n\n',
                '\x1B\x69',  // Cut paper
            ].join('');

            await this.write(receipt);
            LoggerService.info('Payment receipt printed', { paymentId: payment.id, context: 'PrinterService.printPayment' });
        } catch (error) {
            LoggerService.error('Failed to print payment receipt', { error, context: 'PrinterService.printPayment' });
            throw new Error('Failed to print payment receipt');
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
                    LoggerService.error('Failed to close printer port', { error, context: 'PrinterService.cleanup' });
                    reject(error);
                } else {
                    LoggerService.info('Receipt printer disconnected', { context: 'PrinterService.cleanup' });
                    resolve();
                }
            });
        });
    }
} 