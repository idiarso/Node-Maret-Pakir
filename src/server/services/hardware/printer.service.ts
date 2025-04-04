import { LoggerService } from '../logger.service';
import { Ticket } from '../../entities/Ticket';
import { Payment } from '../../entities/Payment';
import { VehicleType } from '../../entities/VehicleType';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export class PrinterService {
    private static instance: PrinterService;
    private printerName: string;

    private constructor() {
        this.printerName = process.env.PRINTER_NAME || 'TM-T82X-S-A';
        
        // Check if printer exists
        exec(`lpstat -p ${this.printerName}`, (error) => {
            if (error) {
                LoggerService.error('Printer not found', { error, context: 'PrinterService.constructor' });
                throw new Error('Printer not found');
            }
            LoggerService.info('Printer connected', { printer: this.printerName, context: 'PrinterService.constructor' });
        });
    }

    public static getInstance(): PrinterService {
        if (!PrinterService.instance) {
            PrinterService.instance = new PrinterService();
        }
        return PrinterService.instance;
    }

    public async printTicket(ticket: Ticket, vehicleType: VehicleType): Promise<void> {
        try {
            const tempFile = path.join('/tmp', `ticket_${ticket.id}.txt`);
            
            // Generate ticket content
            const content = this.generateTicketContent(ticket, vehicleType);
            
            // Write content to temp file
            await fs.writeFile(tempFile, content);
            
            // Print using lp command
            await execAsync(`lp -d ${this.printerName} ${tempFile}`);
            
            // Clean up temp file
            await fs.unlink(tempFile);
            
            LoggerService.info('Ticket printed successfully', { ticketId: ticket.id, context: 'PrinterService.printTicket' });
        } catch (error) {
            LoggerService.error('Failed to print ticket', { error, context: 'PrinterService.printTicket' });
            throw error;
        }
    }

    public async printReceipt(payment: Payment, ticket: Ticket): Promise<void> {
        try {
            const tempFile = path.join('/tmp', `receipt_${payment.id}.txt`);
            
            // Generate receipt content
            const content = this.generateReceiptContent(payment, ticket);
            
            // Write content to temp file
            await fs.writeFile(tempFile, content);
            
            // Print using lp command
            await execAsync(`lp -d ${this.printerName} ${tempFile}`);
            
            // Clean up temp file
            await fs.unlink(tempFile);
            
            LoggerService.info('Receipt printed successfully', { paymentId: payment.id, context: 'PrinterService.printReceipt' });
        } catch (error) {
            LoggerService.error('Failed to print receipt', { error, context: 'PrinterService.printReceipt' });
            throw error;
        }
    }

    private generateTicketContent(ticket: Ticket, vehicleType: VehicleType): string {
        const date = new Date().toLocaleString('id-ID');
        return `
================================
        TIKET PARKIR
================================
No. Tiket: ${ticket.ticketNumber}
Tanggal  : ${date}
Plat No. : ${ticket.plateNumber}
Jenis    : ${vehicleType.name}
================================
    Simpan tiket ini dengan baik
    Kehilangan tiket dikenakan
    denda sesuai ketentuan
================================
`;
    }

    private generateReceiptContent(payment: Payment, ticket: Ticket): string {
        const date = new Date().toLocaleString('id-ID');
        return `
================================
        STRUK PEMBAYARAN
================================
No. Struk : ${payment.id}
No. Tiket : ${ticket.ticketNumber}
Tanggal  : ${date}
Plat No. : ${ticket.plateNumber}
--------------------------------
Durasi   : ${payment.duration} jam
Tarif    : Rp ${payment.rate}
Denda    : Rp ${payment.fine || 0}
--------------------------------
Total    : Rp ${payment.amount}
================================
      Terima kasih atas
      kunjungan Anda
================================
`;
    }
} 