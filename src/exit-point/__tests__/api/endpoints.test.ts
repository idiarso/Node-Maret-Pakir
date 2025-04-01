import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TicketController } from '../../controllers/TicketController';
import { PostgreSQLDatabaseService } from '../../services/DatabaseService';

describe('API Endpoints', () => {
  let ticketController: TicketController;
  let dbService: PostgreSQLDatabaseService;

  beforeEach(async () => {
    dbService = new PostgreSQLDatabaseService();
    await dbService.initialize({
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'parking_system1',
      ssl: false
    });
    ticketController = new TicketController(dbService);
  });

  afterEach(async () => {
    await dbService.close();
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket details for valid ID', async () => {
      const ticketId = '123';
      const ticket = await ticketController.getTicket(ticketId);
      
      expect(ticket).toBeDefined();
      expect(ticket?.id).toBe(ticketId);
    });

    it('should return 404 for non-existent ticket', async () => {
      const ticketId = 'non-existent';
      const ticket = await ticketController.getTicket(ticketId);
      
      expect(ticket).toBeNull();
    });
  });

  describe('POST /api/tickets/:id/complete', () => {
    it('should complete ticket and calculate amount', async () => {
      const ticketId = '123';
      const ticket = await ticketController.completeTicket(ticketId);
      
      expect(ticket).toBeDefined();
      expect(ticket?.status).toBe('completed');
      expect(ticket?.amount).toBeGreaterThan(0);
    });

    it('should handle completion of non-existent ticket', async () => {
      const ticketId = 'non-existent';
      await expect(ticketController.completeTicket(ticketId)).rejects.toThrow();
    });
  });

  describe('POST /api/tickets/:id/payment', () => {
    it('should process payment successfully', async () => {
      const ticketId = '123';
      const paymentData = {
        amount: 5000,
        method: 'cash'
      };

      const result = await ticketController.processPayment(ticketId, paymentData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle invalid payment amount', async () => {
      const ticketId = '123';
      const paymentData = {
        amount: 0,
        method: 'cash'
      };

      await expect(ticketController.processPayment(ticketId, paymentData)).rejects.toThrow();
    });
  });

  describe('POST /api/tickets/:id/print', () => {
    it('should print receipt successfully', async () => {
      const ticketId = '123';
      const result = await ticketController.printReceipt(ticketId);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle printing for non-existent ticket', async () => {
      const ticketId = 'non-existent';
      await expect(ticketController.printReceipt(ticketId)).rejects.toThrow();
    });
  });
}); 