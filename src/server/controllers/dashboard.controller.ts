import { Request, Response } from 'express';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DatabaseService } from '../services/database.service';
import { Ticket } from '../entities/Ticket';
import { VehicleType } from '../entities/VehicleType';
import { Payment } from '../entities/Payment';
import { LoggerService } from '../services/logger.service';
import { ApiError } from '../middleware/error.middleware';
import { TicketStatus, PaymentStatus } from '../../shared/types';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
    private static instance: DashboardController;
    private readonly ticketService: DatabaseService<Ticket>;
    private readonly vehicleTypeService: DatabaseService<VehicleType>;
    private readonly paymentService: DatabaseService<Payment>;
    private readonly dashboardService: DashboardService;

    private constructor() {
        this.ticketService = new DatabaseService(Ticket);
        this.vehicleTypeService = new DatabaseService(VehicleType);
        this.paymentService = new DatabaseService(Payment);
        this.dashboardService = DashboardService.getInstance();
    }

    public static getInstance(): DashboardController {
        if (!DashboardController.instance) {
            DashboardController.instance = new DashboardController();
        }
        return DashboardController.instance;
    }

    public async getDashboardData(req: Request, res: Response) {
        try {
            const data = await this.dashboardService.getDashboardData();
            res.json(data);
        } catch (error) {
            console.error('Error in getDashboardData:', error);
            res.status(500).json({
                error: 'Failed to get dashboard data'
            });
        }
    }

    public async resetDashboardData(req: Request, res: Response) {
        try {
            const data = await this.dashboardService.resetDashboardData();
            res.json({
                success: true,
                message: 'Dashboard data has been reset',
                data
            });
        } catch (error) {
            console.error('Error in resetDashboardData:', error);
            res.status(500).json({
                error: 'Failed to reset dashboard data'
            });
        }
    }

    public async getDashboardStats(req: Request, res: Response) {
        try {
            const today = new Date();
            const todayStart = new Date(today.setHours(0, 0, 0, 0));
            const todayEnd = new Date(today.setHours(23, 59, 59, 999));

            // Get today's statistics
            const [
                activeTickets,
                todayTickets,
                todayRevenue,
                vehicleTypes
            ] = await Promise.all([
                // Current active tickets
                this.ticketService.count({
                    status: TicketStatus.ACTIVE
                }),
                // Today's tickets
                this.ticketService.findAll({
                    where: {
                        entryTime: Between(todayStart, todayEnd)
                    },
                    relations: ['vehicleType']
                }),
                // Today's revenue
                this.paymentService.findAll({
                    where: {
                        createdAt: Between(todayStart, todayEnd),
                        status: PaymentStatus.COMPLETED
                    }
                }),
                // All vehicle types
                this.vehicleTypeService.findAll({
                    where: { isActive: true }
                })
            ]);

            // Calculate vehicle type distribution
            const vehicleDistribution = vehicleTypes.map(type => ({
                id: type.id,
                name: type.name,
                count: todayTickets.filter(ticket => ticket.vehicleTypeId === type.id).length
            }));

            // Calculate total revenue
            const totalRevenue = todayRevenue.reduce((sum, payment) => sum + Number(payment.amount), 0);

            // Calculate hourly distribution
            const hourlyDistribution = Array(24).fill(0);
            todayTickets.forEach(ticket => {
                const hour = new Date(ticket.entryTime).getHours();
                hourlyDistribution[hour]++;
            });

            // Get weekly trend
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            const weeklyTickets = await this.ticketService.findAll({
                where: {
                    entryTime: MoreThanOrEqual(weekStart)
                }
            });

            // Calculate daily trend
            const dailyTrend = Array(7).fill(0);
            weeklyTickets.forEach(ticket => {
                const dayIndex = 6 - Math.floor((today.getTime() - new Date(ticket.entryTime).getTime()) / (1000 * 60 * 60 * 24));
                if (dayIndex >= 0 && dayIndex < 7) {
                    dailyTrend[dayIndex]++;
                }
            });

            return res.json({
                currentStats: {
                    activeTickets,
                    todayTicketCount: todayTickets.length,
                    todayRevenue: totalRevenue
                },
                vehicleDistribution,
                hourlyDistribution,
                dailyTrend
            });
        } catch (error) {
            LoggerService.error('Error getting dashboard stats:', error);
            throw new ApiError(500, 'Failed to get dashboard statistics');
        }
    }

    public async getRevenueReport(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : new Date();
            const end = endDate ? new Date(endDate as string) : new Date();

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            const [payments, vehicleTypes] = await Promise.all([
                this.paymentService.findAll({
                    where: {
                        createdAt: Between(start, end),
                        status: PaymentStatus.COMPLETED
                    },
                    relations: ['ticket', 'ticket.vehicleType']
                }),
                this.vehicleTypeService.findAll()
            ]);

            // Calculate revenue by vehicle type
            const revenueByType = vehicleTypes.map(type => ({
                id: type.id,
                name: type.name,
                revenue: payments
                    .filter(payment => payment.ticket.vehicleTypeId === type.id)
                    .reduce((sum, payment) => sum + Number(payment.amount), 0),
                count: payments.filter(payment => payment.ticket.vehicleTypeId === type.id).length
            }));

            // Calculate total revenue
            const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

            return res.json({
                totalRevenue,
                revenueByType,
                periodStart: start,
                periodEnd: end,
                totalTransactions: payments.length
            });
        } catch (error) {
            LoggerService.error('Error getting revenue report:', error);
            throw new ApiError(500, 'Failed to generate revenue report');
        }
    }

    public async getOccupancyReport(req: Request, res: Response) {
        try {
            const activeTickets = await this.ticketService.findAll({
                where: {
                    status: TicketStatus.ACTIVE
                },
                relations: ['vehicleType']
            });

            const vehicleTypes = await this.vehicleTypeService.findAll({
                where: { isActive: true }
            });

            const occupancyByType = vehicleTypes.map(type => ({
                id: type.id,
                name: type.name,
                count: activeTickets.filter(ticket => ticket.vehicleTypeId === type.id).length
            }));

            return res.json({
                totalOccupancy: activeTickets.length,
                occupancyByType,
                timestamp: new Date()
            });
        } catch (error) {
            LoggerService.error('Error getting occupancy report:', error);
            throw new ApiError(500, 'Failed to generate occupancy report');
        }
    }
} 