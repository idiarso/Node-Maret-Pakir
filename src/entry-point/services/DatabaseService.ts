import { IDatabaseService, TicketData, HardwareError } from '../types/hardware';
import { promises as fs } from 'fs';
import * as path from 'path';

export class DatabaseService implements IDatabaseService {
    private dbPath: string;
    private tickets: Map<string, TicketData>;

    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'tickets.json');
        this.tickets = new Map();
    }

    async initialize(): Promise<void> {
        try {
            // Create data directory if it doesn't exist
            await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

            // Load existing data
            try {
                const data = await fs.readFile(this.dbPath, 'utf-8');
                const tickets = JSON.parse(data);
                this.tickets = new Map(Object.entries(tickets));
            } catch (error) {
                // File doesn't exist or is empty, start with empty database
                await this.saveToFile();
            }
        } catch (error) {
            throw this.createHardwareError(error, 'database', 'INIT_ERROR');
        }
    }

    async createTicket(ticket: Omit<TicketData, 'id'>): Promise<TicketData> {
        try {
            const id = this.generateTicketId();
            const newTicket: TicketData = {
                ...ticket,
                id
            };

            this.tickets.set(id, newTicket);
            await this.saveToFile();

            return newTicket;
        } catch (error) {
            throw this.createHardwareError(error, 'database', 'CREATE_ERROR');
        }
    }

    async getTicket(id: string): Promise<TicketData | null> {
        try {
            return this.tickets.get(id) || null;
        } catch (error) {
            throw this.createHardwareError(error, 'database', 'READ_ERROR');
        }
    }

    async updateTicket(id: string, data: Partial<TicketData>): Promise<TicketData> {
        try {
            const ticket = this.tickets.get(id);
            if (!ticket) {
                throw new Error(`Ticket ${id} not found`);
            }

            const updatedTicket: TicketData = {
                ...ticket,
                ...data
            };

            this.tickets.set(id, updatedTicket);
            await this.saveToFile();

            return updatedTicket;
        } catch (error) {
            throw this.createHardwareError(error, 'database', 'UPDATE_ERROR');
        }
    }

    async dispose(): Promise<void> {
        try {
            await this.saveToFile();
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    private async saveToFile(): Promise<void> {
        const data = Object.fromEntries(this.tickets);
        await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
    }

    private generateTicketId(): string {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        return `TKT${timestamp}${random}`;
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