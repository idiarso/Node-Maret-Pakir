import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { IPrinterService, PrinterConfig, TicketData, HardwareError } from '../types/hardware';

export class PrinterService implements IPrinterService {
    private printer: ThermalPrinter | null = null;
    private config: PrinterConfig | null = null;
    private isInitialized = false;

    async initialize(config: PrinterConfig): Promise<void> {
        try {
            this.config = config;
            
            this.printer = new ThermalPrinter({
                type: PrinterTypes.EPSON,
                interface: config.port,
                width: config.width,
                characterSet: config.characterSet as CharacterSet,
                removeSpecialCharacters: false,
                options: {
                    timeout: 5000
                }
            });

            const isConnected = await this.printer.isPrinterConnected();
            if (!isConnected) {
                throw new Error('Printer not connected');
            }

            this.isInitialized = true;
        } catch (error) {
            throw this.createHardwareError(error, 'printer', 'INIT_ERROR');
        }
    }

    async printTicket(ticket: TicketData): Promise<void> {
        if (!this.isInitialized || !this.printer) {
            throw this.createHardwareError(
                new Error('Printer not initialized'),
                'printer',
                'NOT_INITIALIZED'
            );
        }

        try {
            // Reset printer
            await this.printer.reset();

            // Set text alignment
            await this.printer.alignCenter();

            // Print header
            await this.printer.println('PARKING TICKET');
            await this.printer.println('----------------');
            await this.printer.println(`Ticket ID: ${ticket.id}`);
            await this.printer.println(`Plate: ${ticket.plateNumber}`);
            await this.printer.println(`Entry: ${ticket.entryTime.toLocaleString()}`);
            await this.printer.println(`Type: ${ticket.vehicleType}`);
            await this.printer.println('----------------');

            // Print QR code (if implemented)
            // await this.printer.printQR(ticket.id);

            // Print footer
            await this.printer.println('Thank you for parking!');
            await this.printer.println('----------------');

            // Cut paper
            await this.printer.cut();

            // Reset alignment
            await this.printer.alignLeft();
        } catch (error) {
            throw this.createHardwareError(error, 'printer', 'PRINT_ERROR');
        }
    }

    async dispose(): Promise<void> {
        if (this.printer) {
            try {
                await this.printer.reset();
            } catch (error) {
                console.error('Error resetting printer:', error);
            }
        }
        
        this.printer = null;
        this.isInitialized = false;
        this.config = null;
    }

    private createHardwareError(error: unknown, device: string, code: string): HardwareError {
        const hardwareError = new Error(
            error instanceof Error ? error.message : 'Unknown hardware error'
        ) as HardwareError;
        
        hardwareError.code = code;
        hardwareError.device = device;
        hardwareError.details = error;
        
        return hardwareError;
    }
} 