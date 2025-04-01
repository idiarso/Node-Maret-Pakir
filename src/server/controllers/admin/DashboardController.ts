import { Request, Response } from 'express';
import { AppDataSource } from '../../config/ormconfig';
import { Ticket } from '../../entities/Ticket';
import { Payment } from '../../entities/Payment';
import { VehicleType } from '../../entities/VehicleType';

export class DashboardController {
    private ticketRepository = AppDataSource.getRepository(Ticket);
    private paymentRepository = AppDataSource.getRepository(Payment);
    private vehicleTypeRepository = AppDataSource.getRepository(VehicleType);

    async getDashboardStats(req: Request, res: Response) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get today's stats
            const vehiclesIn = await this.ticketRepository.count({
                where: {
                    entryTime: {
                        $gte: today
                    }
                }
            });

            const vehiclesOut = await this.ticketRepository.count({
                where: {
                    exitTime: {
                        $gte: today
                    }
                }
            });

            const dailyRevenue = await this.paymentRepository
                .createQueryBuilder('payment')
                .select('SUM(payment.amount)', 'total')
                .where('payment.createdAt >= :today', { today })
                .getRawOne();

            // Get weekly stats for chart
            const weeklyStats = await this.getWeeklyStats();
            const dailyStats = await this.getDailyStats();

            res.json({
                vehiclesIn,
                vehiclesOut,
                dailyRevenue: dailyRevenue?.total || 0,
                parkingCapacity: await this.calculateParkingCapacity(),
                dailyStats,
                weeklyRevenue: weeklyStats
            });
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    private async getWeeklyStats() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const stats = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('DATE(payment.createdAt) as date')
            .addSelect('SUM(payment.amount)', 'revenue')
            .where('payment.createdAt >= :weekStart', { weekStart })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        return {
            labels: stats.map(stat => new Date(stat.date).toLocaleDateString('id-ID', { weekday: 'short' })),
            revenue: stats.map(stat => stat.revenue)
        };
    }

    private async getDailyStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hourlyStats = await this.ticketRepository
            .createQueryBuilder('ticket')
            .select('HOUR(ticket.entryTime) as hour')
            .addSelect('COUNT(*)', 'count')
            .where('ticket.entryTime >= :today', { today })
            .groupBy('hour')
            .orderBy('hour', 'ASC')
            .getRawMany();

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const vehiclesIn = hours.map(hour => {
            const stat = hourlyStats.find(s => s.hour === hour);
            return stat ? parseInt(stat.count) : 0;
        });

        const vehiclesOut = await this.ticketRepository
            .createQueryBuilder('ticket')
            .select('HOUR(ticket.exitTime) as hour')
            .addSelect('COUNT(*)', 'count')
            .where('ticket.exitTime >= :today', { today })
            .groupBy('hour')
            .orderBy('hour', 'ASC')
            .getRawMany();

        return {
            labels: hours.map(hour => `${hour}:00`),
            vehiclesIn,
            vehiclesOut: hours.map(hour => {
                const stat = vehiclesOut.find(s => s.hour === hour);
                return stat ? parseInt(stat.count) : 0;
            })
        };
    }

    private async calculateParkingCapacity() {
        const totalSpots = 100; // This should come from configuration
        const activeTickets = await this.ticketRepository.count({
            where: {
                status: 'ACTIVE'
            }
        });

        return Math.round((activeTickets / totalSpots) * 100);
    }
} 