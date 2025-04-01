import { Request, Response } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { Device, DeviceType, DeviceStatus } from '../entities/Device';
import { DeviceHealthCheck } from '../entities/DeviceHealthCheck';
import { DeviceLog, LogType } from '../entities/DeviceLog';
import { AppDataSource } from '../config/ormconfig';

// Mock repositories
jest.mock('../config/ormconfig', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
}));

describe('DeviceController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockDeviceRepository: any;
    let mockHealthCheckRepository: any;
    let mockDeviceLogRepository: any;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        // Mock repositories
        mockDeviceRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn()
        };

        mockHealthCheckRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn()
        };

        mockDeviceLogRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn()
        };

        (AppDataSource.getRepository as jest.Mock)
            .mockImplementation((entity) => {
                if (entity === Device) return mockDeviceRepository;
                if (entity === DeviceHealthCheck) return mockHealthCheckRepository;
                if (entity === DeviceLog) return mockDeviceLogRepository;
                return {};
            });
    });

    describe('getAllDevices', () => {
        it('should return all devices', async () => {
            const mockDevices = [
                { id: 1, name: 'Device 1' },
                { id: 2, name: 'Device 2' }
            ];
            mockDeviceRepository.find.mockResolvedValue(mockDevices);

            await DeviceController.getAllDevices(mockRequest as Request, mockResponse as Response);

            expect(mockDeviceRepository.find).toHaveBeenCalledWith({
                relations: ['healthChecks', 'logs']
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockDevices);
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            mockDeviceRepository.find.mockRejectedValue(error);

            await DeviceController.getAllDevices(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Error fetching devices',
                error
            });
        });
    });

    describe('createDevice', () => {
        it('should create a new device', async () => {
            const deviceData = {
                name: 'New Device',
                type: DeviceType.CAMERA,
                location: 'Test Location'
            };
            mockRequest.body = deviceData;
            mockDeviceRepository.create.mockReturnValue(deviceData);
            mockDeviceRepository.save.mockResolvedValue({ id: 1, ...deviceData });

            await DeviceController.createDevice(mockRequest as Request, mockResponse as Response);

            expect(mockDeviceRepository.create).toHaveBeenCalledWith({
                ...deviceData,
                status: DeviceStatus.ACTIVE
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('should validate required fields', async () => {
            mockRequest.body = { name: 'Device' };

            await DeviceController.createDevice(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Name and type are required'
            });
        });
    });

    describe('performHealthCheck', () => {
        it('should perform health check and update status', async () => {
            const mockDevice = {
                id: 1,
                name: 'Test Device',
                status: DeviceStatus.ACTIVE
            };
            mockRequest.params = { id: '1' };
            mockDeviceRepository.findOne.mockResolvedValue(mockDevice);
            mockHealthCheckRepository.create.mockReturnValue({});
            mockDeviceLogRepository.create.mockReturnValue({});

            await DeviceController.performHealthCheck(mockRequest as Request, mockResponse as Response);

            expect(mockDeviceRepository.save).toHaveBeenCalled();
            expect(mockHealthCheckRepository.save).toHaveBeenCalled();
            expect(mockDeviceLogRepository.save).toHaveBeenCalled();
        });

        it('should handle device not found', async () => {
            mockRequest.params = { id: '999' };
            mockDeviceRepository.findOne.mockResolvedValue(null);

            await DeviceController.performHealthCheck(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Device not found'
            });
        });
    });

    describe('getDeviceLogs', () => {
        it('should return device logs', async () => {
            const mockLogs = [
                { id: 1, type: LogType.INFO, message: 'Test log' }
            ];
            mockRequest.params = { id: '1' };
            mockDeviceRepository.findOne.mockResolvedValue({ id: 1 });
            mockDeviceLogRepository.find.mockResolvedValue(mockLogs);

            await DeviceController.getDeviceLogs(mockRequest as Request, mockResponse as Response);

            expect(mockDeviceLogRepository.find).toHaveBeenCalledWith({
                where: { device: { id: 1 } },
                order: { created_at: 'DESC' }
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockLogs);
        });
    });
}); 