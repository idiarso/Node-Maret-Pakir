import request from 'supertest';
import express from 'express';
import deviceRoutes from '../routes/device.routes';
import { DeviceController } from '../controllers/device.controller';
import { authenticateToken } from '../middleware/auth';

// Mock the controller
jest.mock('../controllers/device.controller');

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
    authenticateToken: jest.fn((req, res, next) => next())
}));

describe('Device Routes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/devices', deviceRoutes);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/devices', () => {
        it('should get all devices', async () => {
            const mockDevices = [
                { id: 1, name: 'Device 1' },
                { id: 2, name: 'Device 2' }
            ];
            (DeviceController.getAllDevices as jest.Mock).mockImplementation((req, res) => {
                res.json(mockDevices);
            });

            const response = await request(app)
                .get('/api/devices')
                .expect(200);

            expect(response.body).toEqual(mockDevices);
            expect(DeviceController.getAllDevices).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('GET /api/devices/:id', () => {
        it('should get device by ID', async () => {
            const mockDevice = { id: 1, name: 'Device 1' };
            (DeviceController.getDeviceById as jest.Mock).mockImplementation((req, res) => {
                res.json(mockDevice);
            });

            const response = await request(app)
                .get('/api/devices/1')
                .expect(200);

            expect(response.body).toEqual(mockDevice);
            expect(DeviceController.getDeviceById).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('POST /api/devices', () => {
        it('should create a new device', async () => {
            const deviceData = {
                name: 'New Device',
                type: 'CAMERA',
                location: 'Test Location'
            };
            const mockDevice = { id: 1, ...deviceData };
            (DeviceController.createDevice as jest.Mock).mockImplementation((req, res) => {
                res.status(201).json(mockDevice);
            });

            const response = await request(app)
                .post('/api/devices')
                .send(deviceData)
                .expect(201);

            expect(response.body).toEqual(mockDevice);
            expect(DeviceController.createDevice).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('PUT /api/devices/:id', () => {
        it('should update a device', async () => {
            const deviceData = {
                name: 'Updated Device',
                type: 'PRINTER'
            };
            const mockDevice = { id: 1, ...deviceData };
            (DeviceController.updateDevice as jest.Mock).mockImplementation((req, res) => {
                res.json(mockDevice);
            });

            const response = await request(app)
                .put('/api/devices/1')
                .send(deviceData)
                .expect(200);

            expect(response.body).toEqual(mockDevice);
            expect(DeviceController.updateDevice).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/devices/:id', () => {
        it('should delete a device', async () => {
            (DeviceController.deleteDevice as jest.Mock).mockImplementation((req, res) => {
                res.json({ message: 'Device deleted successfully' });
            });

            const response = await request(app)
                .delete('/api/devices/1')
                .expect(200);

            expect(response.body).toEqual({ message: 'Device deleted successfully' });
            expect(DeviceController.deleteDevice).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('POST /api/devices/:id/health-check', () => {
        it('should perform health check', async () => {
            const mockHealthCheck = {
                device: { id: 1 },
                status: 'ACTIVE',
                healthCheck: {},
                log: {}
            };
            (DeviceController.performHealthCheck as jest.Mock).mockImplementation((req, res) => {
                res.json(mockHealthCheck);
            });

            const response = await request(app)
                .post('/api/devices/1/health-check')
                .expect(200);

            expect(response.body).toEqual(mockHealthCheck);
            expect(DeviceController.performHealthCheck).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('GET /api/devices/:id/logs', () => {
        it('should get device logs', async () => {
            const mockLogs = [
                { id: 1, type: 'INFO', message: 'Test log' }
            ];
            (DeviceController.getDeviceLogs as jest.Mock).mockImplementation((req, res) => {
                res.json(mockLogs);
            });

            const response = await request(app)
                .get('/api/devices/1/logs')
                .expect(200);

            expect(response.body).toEqual(mockLogs);
            expect(DeviceController.getDeviceLogs).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });

    describe('GET /api/devices/:id/health-checks', () => {
        it('should get device health checks', async () => {
            const mockHealthChecks = [
                { id: 1, status: 'ACTIVE', checked_at: new Date() }
            ];
            (DeviceController.getDeviceHealthChecks as jest.Mock).mockImplementation((req, res) => {
                res.json(mockHealthChecks);
            });

            const response = await request(app)
                .get('/api/devices/1/health-checks')
                .expect(200);

            expect(response.body).toEqual(mockHealthChecks);
            expect(DeviceController.getDeviceHealthChecks).toHaveBeenCalled();
            expect(authenticateToken).toHaveBeenCalled();
        });
    });
}); 