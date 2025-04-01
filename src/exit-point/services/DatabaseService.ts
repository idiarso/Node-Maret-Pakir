import { Pool } from 'pg';
import { DatabaseService as IDatabaseService, Ticket } from '../types';

export interface DatabaseService extends IDatabaseService {}

export class PostgreSQLDatabaseService implements DatabaseService {
  private pool!: Pool;
  private config: any;

  initialize(config: any): void {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl
    });
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create tickets table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id TEXT PRIMARY KEY,
          plateNumber TEXT NOT NULL,
          entryTime TIMESTAMP NOT NULL,
          exitTime TIMESTAMP,
          fee DECIMAL(10,2),
          status TEXT NOT NULL
        )
      `);

      // Create transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          ticketId TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          FOREIGN KEY (ticketId) REFERENCES tickets(id)
        )
      `);
    } finally {
      client.release();
    }
  }

  async query(sql: string, params: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTicket(id: string): Promise<Ticket | null> {
    const result = await this.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      plateNumber: row.plateNumber,
      entryTime: new Date(row.entryTime),
      exitTime: row.exitTime ? new Date(row.exitTime) : undefined,
      fee: row.fee,
      status: row.status as Ticket['status']
    };
  }

  async updateTicket(ticket: Ticket): Promise<boolean> {
    const result = await this.query(
      `UPDATE tickets 
       SET exitTime = $1, fee = $2, status = $3
       WHERE id = $4
       RETURNING id`,
      [
        ticket.exitTime?.toISOString(),
        ticket.fee,
        ticket.status,
        ticket.id
      ]
    );

    return result.length > 0;
  }

  async saveTransaction(ticket: Ticket): Promise<boolean> {
    if (!ticket.fee) {
      return false;
    }

    const result = await this.query(
      `INSERT INTO transactions (id, ticketId, amount, timestamp)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        `TRX-${Date.now()}`,
        ticket.id,
        ticket.fee,
        new Date().toISOString()
      ]
    );

    return result.length > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 