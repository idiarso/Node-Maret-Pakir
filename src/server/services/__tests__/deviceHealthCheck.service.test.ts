import { DeviceHealthCheckService } from '../deviceHealthCheck.service';
import { Device } from '../../entities/Device';
import AppDataSource from '../../config/ormconfig';

// Mock AppDataSource
jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('DeviceHealthCheckService', () => {
  let mockDeviceRepository: any;
  let service: DeviceHealthCheckService;

  beforeEach(() => {
    mockDeviceRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockDeviceRepository);
    service = new DeviceHealthCheckService();
  });

  describe('checkDeviceHealth', () => {
    it('should check health of all devices', async () => {
      const mockDevices = [
        {
          id: 1,
          type: 'RFID',
          status: 'ACTIVE',
          lastCheck: new Date(),
        },
        {
          id: 2,
          type: 'CAMERA',
          status: 'ACTIVE',
          lastCheck: new Date(),
        },
      ];

      mockDeviceRepository.find.mockResolvedValue(mockDevices);

      const result = await service.checkDeviceHealth();

      expect(result).toEqual({
        total: 2,
        active: 2,
        inactive: 0,
        devices: mockDevices,
      });
    });

    it('should handle empty device list', async () => {
      mockDeviceRepository.find.mockResolvedValue([]);

      const result = await service.checkDeviceHealth();

      expect(result).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        devices: [],
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDeviceRepository.find.mockRejectedValue(error);

      await expect(service.checkDeviceHealth()).rejects.toThrow('Database error');
    });
  });

  describe('checkDeviceById', () => {
    it('should check health of specific device', async () => {
      const mockDevice = {
        id: 1,
        type: 'RFID',
        status: 'ACTIVE',
        lastCheck: new Date(),
      };

      mockDeviceRepository.findOne.mockResolvedValue(mockDevice);

      const result = await service.checkDeviceById(1);

      expect(result).toEqual(mockDevice);
    });

    it('should return null for non-existent device', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      const result = await service.checkDeviceById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDeviceRepository.findOne.mockRejectedValue(error);

      await expect(service.checkDeviceById(1)).rejects.toThrow('Database error');
    });
  });

  describe('updateDeviceStatus', () => {
    it('should update device status', async () => {
      const mockDevice = {
        id: 1,
        type: 'RFID',
        status: 'ACTIVE',
        lastCheck: new Date(),
      };

      mockDeviceRepository.findOne.mockResolvedValue(mockDevice);
      mockDeviceRepository.save.mockResolvedValue({
        ...mockDevice,
        status: 'INACTIVE',
        lastCheck: new Date(),
      });

      const result = await service.updateDeviceStatus(1, 'INACTIVE');

      expect(result).toEqual({
        ...mockDevice,
        status: 'INACTIVE',
        lastCheck: expect.any(Date),
      });
    });

    it('should return null for non-existent device', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      const result = await service.updateDeviceStatus(999, 'INACTIVE');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDeviceRepository.findOne.mockRejectedValue(error);

      await expect(service.updateDeviceStatus(1, 'INACTIVE')).rejects.toThrow('Database error');
    });
  });

  describe('getDeviceStatus', () => {
    it('should return device status', async () => {
      const mockDevice = {
        id: 1,
        type: 'RFID',
        status: 'ACTIVE',
        lastCheck: new Date(),
      };

      mockDeviceRepository.findOne.mockResolvedValue(mockDevice);

      const result = await service.getDeviceStatus(1);

      expect(result).toEqual({
        status: 'ACTIVE',
        lastCheck: mockDevice.lastCheck,
      });
    });

    it('should return null for non-existent device', async () => {
      mockDeviceRepository.findOne.mockResolvedValue(null);

      const result = await service.getDeviceStatus(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDeviceRepository.findOne.mockRejectedValue(error);

      await expect(service.getDeviceStatus(1)).rejects.toThrow('Database error');
    });
  });

  describe('getDeviceMetrics', () => {
    it('should return device metrics', async () => {
      const mockDevices = [
        {
          id: 1,
          type: 'RFID',
          status: 'ACTIVE',
          lastCheck: new Date(),
        },
        {
          id: 2,
          type: 'CAMERA',
          status: 'INACTIVE',
          lastCheck: new Date(),
        },
      ];

      mockDeviceRepository.find.mockResolvedValue(mockDevices);

      const result = await service.getDeviceMetrics();

      expect(result).toEqual({
        total: 2,
        active: 1,
        inactive: 1,
        byType: {
          RFID: 1,
          CAMERA: 1,
        },
      });
    });

    it('should handle empty device list', async () => {
      mockDeviceRepository.find.mockResolvedValue([]);

      const result = await service.getDeviceMetrics();

      expect(result).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        byType: {},
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDeviceRepository.find.mockRejectedValue(error);

      await expect(service.getDeviceMetrics()).rejects.toThrow('Database error');
    });
  });
}); 