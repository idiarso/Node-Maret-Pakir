import { Request, Response } from 'express';
import { MembershipController } from '../membership.controller';
import AppDataSource from '../../config/ormconfig';
import { Membership } from '../../entities/Membership';
import { Vehicle } from '../../entities/Vehicle';

// Mock AppDataSource
jest.mock('../../config/ormconfig', () => ({
  getRepository: jest.fn(),
}));

describe('MembershipController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockMembershipRepository: any;
  let mockVehicleRepository: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockMembershipRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockVehicleRepository = {
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockImplementation((entity) => {
        if (entity === Membership) {
          return mockMembershipRepository;
        }
        if (entity === Vehicle) {
          return mockVehicleRepository;
        }
        return null;
      });
  });

  describe('getAllMemberships', () => {
    it('should return all memberships', async () => {
      const mockMemberships = [
        { id: 1, type: 'MONTHLY' },
        { id: 2, type: 'YEARLY' },
      ];

      mockMembershipRepository.find.mockResolvedValue(mockMemberships);

      await MembershipController.getAllMemberships(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockMemberships);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockMembershipRepository.find.mockRejectedValue(error);

      await MembershipController.getAllMemberships(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching memberships',
        error,
      });
    });
  });

  describe('getMembershipById', () => {
    it('should return membership by id', async () => {
      const mockMembership = { id: 1, type: 'MONTHLY' };
      mockRequest.params = { id: '1' };
      mockMembershipRepository.findOne.mockResolvedValue(mockMembership);

      await MembershipController.getMembershipById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockMembership);
    });

    it('should return 404 if membership not found', async () => {
      mockRequest.params = { id: '1' };
      mockMembershipRepository.findOne.mockResolvedValue(null);

      await MembershipController.getMembershipById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Membership not found',
      });
    });
  });

  describe('createMembership', () => {
    it('should create new membership', async () => {
      const mockVehicle = { id: 1 };
      const mockMembership = {
        id: 1,
        type: 'MONTHLY',
        start_date: new Date(),
      };

      mockRequest.body = {
        vehicle_id: 1,
        type: 'MONTHLY',
        start_date: new Date(),
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockMembershipRepository.findOne.mockResolvedValue(null);
      mockMembershipRepository.create.mockReturnValue(mockMembership);
      mockMembershipRepository.save.mockResolvedValue(mockMembership);

      await MembershipController.createMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockMembership);
    });

    it('should return 400 if vehicle not found', async () => {
      mockRequest.body = {
        vehicle_id: 1,
        type: 'MONTHLY',
        start_date: new Date(),
      };

      mockVehicleRepository.findOne.mockResolvedValue(null);

      await MembershipController.createMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Vehicle not found',
      });
    });

    it('should return 400 if vehicle already has active membership', async () => {
      mockRequest.body = {
        vehicle_id: 1,
        type: 'MONTHLY',
        start_date: new Date(),
      };

      mockVehicleRepository.findOne.mockResolvedValue({ id: 1 });
      mockMembershipRepository.findOne.mockResolvedValue({ id: 1, status: 'ACTIVE' });

      await MembershipController.createMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Vehicle already has an active membership',
      });
    });
  });

  describe('updateMembership', () => {
    it('should update membership', async () => {
      const mockMembership = {
        id: 1,
        type: 'MONTHLY',
        start_date: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        type: 'YEARLY',
        start_date: new Date(),
      };

      mockMembershipRepository.findOne.mockResolvedValue(mockMembership);
      mockMembershipRepository.save.mockResolvedValue({
        ...mockMembership,
        type: 'YEARLY',
      });

      await MembershipController.updateMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockMembership,
        type: 'YEARLY',
      });
    });

    it('should return 404 if membership not found', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        type: 'YEARLY',
        start_date: new Date(),
      };

      mockMembershipRepository.findOne.mockResolvedValue(null);

      await MembershipController.updateMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Membership not found',
      });
    });
  });

  describe('deleteMembership', () => {
    it('should delete membership', async () => {
      const mockMembership = { id: 1 };

      mockRequest.params = { id: '1' };
      mockMembershipRepository.findOne.mockResolvedValue(mockMembership);
      mockMembershipRepository.remove.mockResolvedValue(mockMembership);

      await MembershipController.deleteMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Membership deleted successfully',
      });
    });

    it('should return 404 if membership not found', async () => {
      mockRequest.params = { id: '1' };
      mockMembershipRepository.findOne.mockResolvedValue(null);

      await MembershipController.deleteMembership(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Membership not found',
      });
    });
  });
}); 