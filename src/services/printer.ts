import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

export class PrinterService {
  private printer: ThermalPrinter;

  constructor() {
    this.printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'printer:USB001',
      width: 32,
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      options: {
        timeout: 5000
      }
    });
  }

  async printTicket(data: {
    ticketNumber: string;
    plateNumber: string;
    entryTime: string;
    amount: number;
  }) {
    try {
      // Check printer connection
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('Printer not connected');
      }
      
      // Header
      this.printer.alignCenter();
      this.printer.setTextNormal();
      this.printer.println('PARKING TICKET');
      this.printer.println('----------------');
      
      // Ticket details
      this.printer.alignLeft();
      this.printer.println(`Ticket: ${data.ticketNumber}`);
      this.printer.println(`Plate: ${data.plateNumber}`);
      this.printer.println(`Entry: ${data.entryTime}`);
      this.printer.println(`Amount: Rp ${data.amount.toLocaleString()}`);
      
      // Footer
      this.printer.alignCenter();
      this.printer.println('----------------');
      this.printer.println('Thank you for parking!');
      this.printer.println('Please keep this ticket');
      this.printer.println('for exit payment');
      
      // Cut paper
      this.printer.cut();
      
      // Execute print
      await this.printer.execute();
      
      return true;
    } catch (error) {
      console.error('Printer error:', error);
      throw error;
    }
  }

  async testPrint() {
    try {
      const isConnected = await this.printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('Printer not connected');
      }

      this.printer.alignCenter();
      this.printer.setTextNormal();
      this.printer.println('TEST PRINT');
      this.printer.println('----------------');
      this.printer.println(new Date().toLocaleString());
      this.printer.println('----------------');
      this.printer.cut();
      
      await this.printer.execute();
      return true;
    } catch (error) {
      console.error('Test print error:', error);
      throw error;
    }
  }
} 