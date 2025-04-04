import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ParkingSession } from '../models/ParkingSession';
import { ParkingArea } from '../models/ParkingArea';
import { Device } from '../models/Device';
import { Vehicle } from '../models/Vehicle';

export class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  public async resetDashboardData() {
    try {
      // Reset parking sessions to COMPLETED status
      await AppDataSource.getRepository(ParkingSession)
        .createQueryBuilder()
        .update()
        .set({ status: 'COMPLETED' })
        .where('status = :status', { status: 'ACTIVE' })
        .execute();

      // Reset device status to ONLINE
      await AppDataSource.getRepository(Device)
        .createQueryBuilder()
        .update()
        .set({ status: 'ONLINE' })
        .where('status != :status', { status: 'ONLINE' })
        .execute();

      // Get fresh dashboard data
      return await this.getDashboardData();
    } catch (error) {
      console.error('Error resetting dashboard data:', error);
      throw error;
    }
  }

  public async getDashboardData() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.setDate(now.getDate() - 7));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get active sessions
      const activeTickets = await AppDataSource.getRepository(ParkingSession)
        .count({
          where: { status: 'ACTIVE' }
        });

      // Get total tickets for today
      const totalTickets = await AppDataSource.getRepository(ParkingSession)
        .count({
          where: {
            entryTime: MoreThanOrEqual(today)
          }
        });

      // Get parking space availability
      const parkingAreas = await AppDataSource.getRepository(ParkingArea)
        .find({
          where: { isActive: true }
        });

      const totalCapacity = parkingAreas.reduce((sum, area) => sum + area.capacity, 0);
      const occupiedSpots = await AppDataSource.getRepository(ParkingSession)
        .count({
          where: { status: 'ACTIVE' }
        });

      const availableSpots = totalCapacity - occupiedSpots;
      const occupancyRate = totalCapacity > 0 ? (occupiedSpots / totalCapacity) * 100 : 0;

      // Calculate revenue
      const todayRevenue = await this.calculateRevenue(today);
      const weeklyRevenue = await this.calculateRevenue(weekStart);
      const monthlyRevenue = await this.calculateRevenue(monthStart);

      // Get average parking duration (in minutes)
      const completedSessions = await AppDataSource.getRepository(ParkingSession)
        .find({
          where: {
            status: 'COMPLETED',
            exitTime: MoreThanOrEqual(today)
          }
        });

      const avgParkingDuration = this.calculateAverageParkingDuration(completedSessions);

      // Get peak hours
      const peakHours = await this.calculatePeakHours(today);

      // Get vehicle type distribution
      const vehicleDistribution = await this.getVehicleDistribution();

      // Get device status
      const deviceStatus = await this.getDeviceStatus();

      // Get recent transactions
      const recentTransactions = await AppDataSource.getRepository(ParkingSession)
        .find({
          relations: ['vehicle', 'parkingArea'],
          where: {
            entryTime: MoreThanOrEqual(today)
          },
          order: { entryTime: 'DESC' },
          take: 10
        });

      return {
        activeTickets,
        totalTickets,
        availableSpots,
        totalCapacity,
        occupancyRate,
        revenue: {
          today: todayRevenue,
          weekly: weeklyRevenue,
          monthly: monthlyRevenue
        },
        avgParkingDuration,
        peakHours,
        vehicleDistribution,
        deviceStatus,
        recentTransactions: recentTransactions.map(session => ({
          id: session.id,
          vehiclePlate: session.vehicle.licensePlate,
          parkingArea: session.parkingArea.name,
          entryTime: session.entryTime,
          exitTime: session.exitTime,
          fee: session.fee,
          status: session.status
        }))
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  private async calculateRevenue(startDate: Date): Promise<number> {
    const result = await AppDataSource.getRepository(ParkingSession)
      .createQueryBuilder('session')
      .select('SUM(session.fee)', 'total')
      .where('session.status = :status', { status: 'COMPLETED' })
      .andWhere('session.exitTime >= :startDate', { startDate })
      .getRawOne();

    return result?.total || 0;
  }

  private calculateAverageParkingDuration(sessions: ParkingSession[]): number {
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      if (session.exitTime) {
        const duration = session.exitTime.getTime() - session.entryTime.getTime();
        return sum + duration;
      }
      return sum;
    }, 0);

    return Math.round(totalDuration / (sessions.length * 60000)); // Convert to minutes
  }

  private async calculatePeakHours(date: Date): Promise<Array<{ hour: number; count: number }>> {
    const sessions = await AppDataSource.getRepository(ParkingSession)
      .find({
        where: {
          entryTime: MoreThanOrEqual(date)
        }
      });

    const hourCounts = new Array(24).fill(0);
    sessions.forEach(session => {
      const hour = session.entryTime.getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({ hour, count }));
  }

  private async getVehicleDistribution(): Promise<Array<{ type: string; count: number }>> {
    const vehicles = await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder('vehicle')
      .select('vehicle.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vehicle.type')
      .getRawMany();

    return vehicles;
  }

  private async getDeviceStatus(): Promise<Array<{ type: string; status: string; count: number }>> {
    const devices = await AppDataSource.getRepository(Device)
      .createQueryBuilder('device')
      .select('device.type', 'type')
      .addSelect('device.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('device.type')
      .addGroupBy('device.status')
      .getRawMany();

    return devices;
  }
} 