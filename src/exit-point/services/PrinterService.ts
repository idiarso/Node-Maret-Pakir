import { PrinterService as IPrinterService } from '../types';

export interface PrinterService extends IPrinterService {}

export class ReceiptPrinterService implements PrinterService {
  private isPrinting: boolean = false;
  private config: any;

  initialize(config: any): void {
    this.config = config;
  }

  async print(data: any): Promise<void> {
    // Implementasi printing
  }
} 