import { LoggerService } from '../logger.service';
import { GateService } from './gate.service';
import { BarcodeService, BarcodeData } from './barcode.service';
import { PrinterService } from './printer.service';
import { Ticket } from '../../entities/Ticket';
import { Payment } from '../../entities/Payment';
import { VehicleType } from '../../entities/VehicleType';
import { EventEmitter } from 'events';

export class HardwareService extends EventEmitter {
    private static instance: HardwareService;
    private gate: GateService;
    private barcode: BarcodeService;
    private printer: PrinterService;

    private constructor() {
        super();
        try {
            this.gate = GateService.getInstance();
            this.barcode = BarcodeService.getInstance();
            this.printer = PrinterService.getInstance();

            // Forward barcode events
            this.barcode.on('barcode', (data: BarcodeData) => {
                this.emit('barcode', data);
            });

            this.barcode.on('error', (error: Error) => {
                LoggerService.error('Barcode scanner error', { error, context: 'HardwareService.constructor' });
                this.emit('error', { device: 'barcode', error });
            });

            LoggerService.info('Hardware service initialized', { context: 'HardwareService.constructor' });
        } catch (error) {
            LoggerService.error('Failed to initialize hardware service', { error, context: 'HardwareService.constructor' });
            throw new Error('Failed to initialize hardware service');
        }
    }

    public static getInstance(): HardwareService {
        if (!HardwareService.instance) {
            HardwareService.instance = new HardwareService();
        }
        return HardwareService.instance;
    }

    public async openGate(userId?: number): Promise<void> {
        try {
            await this.gate.open(userId);
        } catch (error) {
            LoggerService.error('Failed to open gate', { error, context: 'HardwareService.openGate' });
            throw error;
        }
    }

    public async closeGate(userId?: number): Promise<void> {
        try {
            await this.gate.close(userId);
        } catch (error) {
            LoggerService.error('Failed to close gate', { error, context: 'HardwareService.closeGate' });
            throw error;
        }
    }

    public async getGateStatus(): Promise<{ isOpen: boolean }> {
        try {
            return await this.gate.getStatus();
        } catch (error) {
            LoggerService.error('Failed to get gate status', { error, context: 'HardwareService.getGateStatus' });
            throw error;
        }
    }

    public async printTicket(ticket: Ticket, vehicleType: VehicleType): Promise<void> {
        try {
            await this.printer.printTicket(ticket, vehicleType);
        } catch (error) {
            LoggerService.error('Failed to print ticket', { error, context: 'HardwareService.printTicket' });
            throw error;
        }
    }

    public async printPayment(payment: Payment, ticket: Ticket, vehicleType: VehicleType): Promise<void> {
        try {
            await this.printer.printPayment(payment, ticket, vehicleType);
        } catch (error) {
            LoggerService.error('Failed to print payment receipt', { error, context: 'HardwareService.printPayment' });
            throw error;
        }
    }

    public async cleanup(): Promise<void> {
        try {
            await Promise.all([
                this.gate.cleanup(),
                this.barcode.cleanup(),
                this.printer.cleanup()
            ]);
            LoggerService.info('Hardware service cleaned up', { context: 'HardwareService.cleanup' });
        } catch (error) {
            LoggerService.error('Failed to cleanup hardware service', { error, context: 'HardwareService.cleanup' });
            throw error;
        }
    }
} 