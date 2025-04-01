import { Ticket, ScannerService, PrinterService, DatabaseService, GateController, WebSocketClient } from '../types';

export class ExitTicketController {
  constructor(
    private scanner: ScannerService,
    private printer: PrinterService,
    private database: DatabaseService,
    private gate: GateController,
    private wsClient: WebSocketClient
  ) {}

  async scanTicket(): Promise<{ success: boolean; data?: Ticket; error?: string }> {
    try {
      const result = await this.scanner.scanTicket();
      if (!result.success) {
        return result;
      }

      // Get ticket from database
      const ticket = await this.database.getTicket(result.data!.id);
      if (!ticket) {
        return { success: false, error: 'Ticket not found in database' };
      }

      return { success: true, data: ticket };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async processPayment(ticketId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get ticket from database
      const ticket = await this.database.getTicket(ticketId);
      if (!ticket) {
        return { success: false, error: 'Ticket not found' };
      }

      if (ticket.status !== 'active') {
        return { success: false, error: 'Ticket is not active' };
      }

      // Calculate fee based on duration
      const now = new Date();
      const duration = now.getTime() - ticket.entryTime.getTime();
      const hours = Math.ceil(duration / (1000 * 60 * 60));
      const fee = hours * 5000; // Rp 5,000 per hour

      // Update ticket with exit time and fee
      ticket.exitTime = now;
      ticket.fee = fee;
      ticket.status = 'completed';

      const updated = await this.database.updateTicket(ticket);
      if (!updated) {
        return { success: false, error: 'Failed to update ticket' };
      }

      // Save transaction
      const saved = await this.database.saveTransaction(ticket);
      if (!saved) {
        return { success: false, error: 'Failed to save transaction' };
      }

      // Print receipt
      const printResult = await this.printer.printReceipt(ticket);
      if (!printResult.success) {
        console.error('Failed to print receipt:', printResult.error);
      }

      // Open gate
      const gateResult = await this.gate.open();
      if (!gateResult.success) {
        console.error('Failed to open gate:', gateResult.error);
      }

      // Notify server via WebSocket
      try {
        await this.wsClient.send('ticket_completed', {
          ticketId: ticket.id,
          plateNumber: ticket.plateNumber,
          exitTime: ticket.exitTime,
          fee: ticket.fee
        });
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getStatus(): Promise<{ status: string }> {
    try {
      // Check if all services are ready
      const scannerReady = true; // TODO: Implement actual scanner status check
      const printerReady = true; // TODO: Implement actual printer status check
      const gateReady = true; // TODO: Implement actual gate status check
      const databaseReady = true; // TODO: Implement actual database status check
      const wsConnected = true; // TODO: Implement actual WebSocket connection check

      if (scannerReady && printerReady && gateReady && databaseReady && wsConnected) {
        return { status: 'ready' };
      }

      return { status: 'error' };
    } catch (error) {
      return { status: 'error' };
    }
  }
} 