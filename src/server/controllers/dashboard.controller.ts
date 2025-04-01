import { Request, Response } from 'express';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DatabaseService } from '../services/database.service';
import { Ticket } from '../entities/Ticket';
import { VehicleType } from '../entities/VehicleType';
import { Payment } from '../entities/Payment';
import { LoggerService } from '../services/logger.service';
import { ApiError } from '../middleware/error.middleware';
import { TicketStatus, PaymentStatus } from '../../shared/types';

export class DashboardController {
    private static ticketService = new DatabaseService(Ticket);
    private static vehicleTypeService = new DatabaseService(VehicleType);
    private static paymentService = new DatabaseService(Payment);

    static async getDashboardStats(req: Request, res: Response) {
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
                DashboardController.ticketService.count({
                    status: TicketStatus.ACTIVE
                }),
                // Today's tickets
                DashboardController.ticketService.findAll({
                    where: {
                        entryTime: Between(todayStart, todayEnd)
                    },
                    relations: ['vehicleType']
                }),
                // Today's revenue
                DashboardController.paymentService.findAll({
                    where: {
                        createdAt: Between(todayStart, todayEnd),
                        status: PaymentStatus.COMPLETED
                    }
                }),
                // All vehicle types
                DashboardController.vehicleTypeService.findAll({
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
            const weeklyTickets = await DashboardController.ticketService.findAll({
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

    static async getRevenueReport(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : new Date();
            const end = endDate ? new Date(endDate as string) : new Date();

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            const [payments, vehicleTypes] = await Promise.all([
                DashboardController.paymentService.findAll({
                    where: {
                        createdAt: Between(start, end),
                        status: PaymentStatus.COMPLETED
                    },
                    relations: ['ticket', 'ticket.vehicleType']
                }),
                DashboardController.vehicleTypeService.findAll()
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

    static async getOccupancyReport(req: Request, res: Response) {
        try {
            const activeTickets = await DashboardController.ticketService.findAll({
                where: {
                    status: TicketStatus.ACTIVE
                },
                relations: ['vehicleType']
            });

            const vehicleTypes = await DashboardController.vehicleTypeService.findAll({
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