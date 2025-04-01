import { AppDataSource } from '../config/ormconfig';
import { Ticket, TicketStatus } from '../entities/Ticket';
import { Payment, PaymentStatus } from '../entities/Payment';
import { VehicleType } from '../entities/VehicleType';
import { AppError } from '../../shared/services/ErrorHandler';
import { Logger } from '../../shared/services/Logger';
import { User } from '../entities/User';
import { Between } from 'typeorm';

export class TicketService {
    private static instance: TicketService;
    private ticketRepository = AppDataSource.getRepository(Ticket);
    private paymentRepository = AppDataSource.getRepository(Payment);
    private vehicleTypeRepository = AppDataSource.getRepository(VehicleType);
    private logger = Logger.getInstance();

    private constructor() {}

    public static getInstance(): TicketService {
        if (!TicketService.instance) {
            TicketService.instance = new TicketService();
        }
        return TicketService.instance;
    }

    public async createTicket(data: {
        plateNumber: string;
        vehicleTypeId: number;
        operatorId: number;
        notes?: string;
    }): Promise<Ticket> {
        const vehicleType = await this.vehicleTypeRepository.findOne({
            where: { id: data.vehicleTypeId }
        });

        if (!vehicleType) {
            throw new AppError(404, 'Vehicle type not found');
        }

        const ticket = this.ticketRepository.create({
            ...data,
            barcode: this.generateBarcode(),
            entryTime: new Date(),
            status: TicketStatus.ACTIVE
        });

        await this.ticketRepository.save(ticket);
        this.logger.info(`Ticket created: ${ticket.barcode}`);

        return ticket;
    }

    public async getTicket(barcode: string): Promise<Ticket> {
        const ticket = await this.ticketRepository.findOne({
            where: { barcode },
            relations: ['vehicleType', 'operator']
        });

        if (!ticket) {
            throw new AppError(404, 'Ticket not found');
        }

        return ticket;
    }

    public async completeTicket(barcode: string): Promise<Ticket> {
        const ticket = await this.getTicket(barcode);
        
        if (ticket.status !== TicketStatus.ACTIVE) {
            throw new AppError(400, 'Ticket is not active');
        }

        ticket.exitTime = new Date();
        ticket.status = TicketStatus.COMPLETED;
        await this.ticketRepository.save(ticket);

        this.logger.info(`Ticket completed: ${ticket.barcode}`);
        return ticket;
    }

    public async calculateParkingFee(ticket: Ticket): Promise<number> {
        const entryTime = new Date(ticket.entryTime);
        const exitTime = new Date();
        const duration = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60); // hours

        // Round up to nearest hour
        const hours = Math.ceil(duration);
        return hours * ticket.vehicleType.price;
    }

    public async createPayment(data: {
        ticketId: number;
        amount: number;
        paymentMethod: string;
        operatorId: number;
        notes?: string;
    }): Promise<Payment> {
        const ticket = await this.ticketRepository.findOne({
            where: { id: data.ticketId }
        });

        if (!ticket) {
            throw new AppError(404, 'Ticket not found');
        }

        if (ticket.status !== TicketStatus.ACTIVE) {
            throw new AppError(400, 'Ticket is not active');
        }

        const payment = this.paymentRepository.create({
            ...data,
            status: PaymentStatus.COMPLETED
        });

        await this.paymentRepository.save(payment);
        this.logger.info(`Payment created for ticket: ${ticket.barcode}`);

        return payment;
    }

    public async getActiveTickets(): Promise<Ticket[]> {
        return this.ticketRepository.find({
            where: { status: TicketStatus.ACTIVE },
            relations: ['vehicleType', 'operator']
        });
    }

    public async getTicketsByDateRange(startDate: Date, endDate: Date): Promise<Ticket[]> {
        return this.ticketRepository.find({
            where: {
                entryTime: Between(startDate, endDate)
            },
            relations: ['vehicleType', 'operator']
        });
    }

    private generateBarcode(): string {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TKT${timestamp}${random}`;
    }
} 