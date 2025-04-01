import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PostgreSQLDatabaseService } from '../../services/DatabaseService';

describe('PostgreSQLDatabaseService', () => {
  let dbService: PostgreSQLDatabaseService;

  beforeEach(() => {
    dbService = new PostgreSQLDatabaseService();
  });

  afterEach(async () => {
    await dbService.close();
  });

  describe('initialize', () => {
    it('should initialize with correct configuration', async () => {
      const config = {
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'parking_system1',
        ssl: false
      };

      await dbService.initialize(config);
      // Add assertions based on your implementation
    });
  });

  describe('getTicket', () => {
    it('should retrieve ticket by ID', async () => {
      await dbService.initialize({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'parking_system1',
        ssl: false
      });

      const ticket = await dbService.getTicket('123');
      expect(ticket).toBeDefined();
      expect(ticket?.id).toBe('123');
    });

    it('should return null for non-existent ticket', async () => {
      await dbService.initialize({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'parking_system1',
        ssl: false
      });

      const ticket = await dbService.getTicket('non-existent');
      expect(ticket).toBeNull();
    });
  });

  describe('updateTicket', () => {
    it('should update ticket status', async () => {
      await dbService.initialize({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'parking_system1',
        ssl: false
      });

      const ticket = {
        id: '123',
        status: 'completed',
        exitTime: new Date(),
        amount: 5000
      };

      await dbService.updateTicket(ticket);
      const updatedTicket = await dbService.getTicket('123');
      expect(updatedTicket?.status).toBe('completed');
    });
  });
}); 