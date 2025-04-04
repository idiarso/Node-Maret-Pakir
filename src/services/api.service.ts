import axios from 'axios';
import { logger } from '../utils/logger';

interface ParkingSession {
    id: string;
    entryTime: Date;
    exitTime?: Date;
    vehicleType: string;
    plateNumber: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface DashboardData {
    activeTickets: number;
    totalTickets: number;
    availableSpots: number;
    todayRevenue: number;
}

interface DeviceStatus {
    camera: boolean;
    printer: boolean;
    arduino: boolean;
    lastCheck: Date;
}

interface Payment {
    id: string;
    amount: number;
    method: 'CASH' | 'CARD' | 'QRIS';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    sessionId: string;
    createdAt: Date;
}

interface Vehicle {
    id: string;
    plateNumber: string;
    type: 'CAR' | 'MOTORCYCLE' | 'TRUCK';
    brand?: string;
    model?: string;
    color?: string;
}

interface ReportParams {
    startDate: Date;
    endDate: Date;
    type?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface ReportData {
    totalRevenue: number;
    totalSessions: number;
    vehicleTypes: Record<string, number>;
    peakHours: Array<{ hour: number; count: number }>;
    averageDuration: number;
}

export class ApiService {
    private static instance: ApiService;
    private baseURL: string;

    private constructor() {
        this.baseURL = process.env.API_URL || 'http://localhost:3000/api';
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    private async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
        try {
            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                data,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            logger.error('API Error:', error);
            throw error;
        }
    }

    // Parking Sessions
    async getParkingSessions(): Promise<ParkingSession[]> {
        return this.request<ParkingSession[]>('GET', '/parking/sessions');
    }

    async createParkingSession(data: Omit<ParkingSession, 'id'>): Promise<ParkingSession> {
        return this.request<ParkingSession>('POST', '/parking/sessions', data);
    }

    async updateParkingSession(id: string, data: Partial<ParkingSession>): Promise<ParkingSession> {
        return this.request<ParkingSession>('PUT', `/parking/sessions/${id}`, data);
    }

    async getParkingSessionByPlate(plateNumber: string): Promise<ParkingSession | null> {
        return this.request<ParkingSession | null>('GET', `/parking/sessions/plate/${plateNumber}`);
    }

    // Payment Management
    async createPayment(sessionId: string, data: Omit<Payment, 'id' | 'sessionId' | 'createdAt'>): Promise<Payment> {
        return this.request<Payment>('POST', `/payments/${sessionId}`, data);
    }

    async getPaymentStatus(paymentId: string): Promise<Payment> {
        return this.request<Payment>('GET', `/payments/${paymentId}`);
    }

    async cancelPayment(paymentId: string): Promise<Payment> {
        return this.request<Payment>('POST', `/payments/${paymentId}/cancel`);
    }

    // Vehicle Management
    async registerVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
        return this.request<Vehicle>('POST', '/vehicles', data);
    }

    async getVehicleByPlate(plateNumber: string): Promise<Vehicle | null> {
        return this.request<Vehicle | null>('GET', `/vehicles/plate/${plateNumber}`);
    }

    async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
        return this.request<Vehicle>('PUT', `/vehicles/${id}`, data);
    }

    // Dashboard Data
    async getDashboardData(): Promise<DashboardData> {
        return this.request<DashboardData>('GET', '/dashboard');
    }

    async resetDashboardData(): Promise<DashboardData> {
        return this.request<DashboardData>('POST', '/dashboard/reset');
    }

    // Device Status
    async getDeviceStatus(): Promise<DeviceStatus> {
        return this.request<DeviceStatus>('GET', '/devices/status');
    }

    async updateDeviceStatus(deviceType: keyof DeviceStatus, status: boolean): Promise<DeviceStatus> {
        return this.request<DeviceStatus>('PUT', `/devices/${deviceType}`, { status });
    }

    // Reporting
    async generateReport(params: ReportParams): Promise<ReportData> {
        return this.request<ReportData>('GET', '/reports/generate', params);
    }

    async exportReport(params: ReportParams, format: 'PDF' | 'EXCEL'): Promise<Blob> {
        const response = await axios({
            method: 'GET',
            url: `${this.baseURL}/reports/export`,
            params: { ...params, format },
            responseType: 'blob'
        });
        return new Blob([response.data as BlobPart], { 
            type: format === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
    }
}

export default ApiService.getInstance(); 