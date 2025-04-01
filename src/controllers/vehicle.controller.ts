import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest, UserRole } from '../shared/types';
import { Vehicle } from '../server/entities/Vehicle';
import { User } from '../server/entities/User';
import { Like } from 'typeorm';

interface VehicleResponse {
  id: number;
  plate_number: string;
  type: string;
  owner_name: string;
  owner_contact: string;
  registration_date: Date;
  created_at: Date;
  updated_at: Date;
}

export class VehicleController {
  private vehicleRepository;
  private userRepository;

  constructor(private dataSource: DataSource) {
    this.vehicleRepository = dataSource.getRepository(Vehicle);
    this.userRepository = dataSource.getRepository(User);
  }

  private async getUserFullName(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.fullName || '';
  }

  public registerVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber, type, ownerContact } = req.body;
      const userId = req.user.id;

      const existingVehicle = await this.vehicleRepository.findOne({
        where: { plate_number: plateNumber }
      });

      if (existingVehicle) {
        return res.status(400).json({ message: 'Vehicle already registered' });
      }

      const owner = await this.userRepository.findOne({
        where: { id: userId }
      });

      if (!owner) {
        return res.status(404).json({ message: 'Owner not found' });
      }

      const vehicle = this.vehicleRepository.create({
        plate_number: plateNumber,
        type,
        owner_name: owner.fullName,
        owner_contact: ownerContact,
        registration_date: new Date()
      });

      const savedVehicle = await this.vehicleRepository.save(vehicle);
      return res.status(201).json(savedVehicle);
    } catch (error) {
      console.error('Register vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public getVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber } = req.params;
      const userFullName = await this.getUserFullName(req.user.id);

      const vehicle = await this.vehicleRepository.findOne({
        where: { plate_number: plateNumber }
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Check if user has access to this vehicle
      if (vehicle.owner_name !== userFullName && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      return res.json(vehicle);
    } catch (error) {
      console.error('Get vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public listVehicles = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');
      
      if (req.user.role !== UserRole.ADMIN) {
        const userFullName = await this.getUserFullName(req.user.id);
        queryBuilder.where('vehicle.owner_name = :ownerName', { ownerName: userFullName });
      }

      queryBuilder.orderBy('vehicle.plate_number', 'ASC');

      const vehicles = await queryBuilder.getMany();
      return res.json(vehicles);
    } catch (error) {
      console.error('List vehicles error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public updateVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber } = req.params;
      const { type, ownerContact } = req.body;
      const userFullName = await this.getUserFullName(req.user.id);

      const vehicle = await this.vehicleRepository.findOne({
        where: { plate_number: plateNumber }
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      if (vehicle.owner_name !== userFullName && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (type) vehicle.type = type;
      if (ownerContact) vehicle.owner_contact = ownerContact;

      const updatedVehicle = await this.vehicleRepository.save(vehicle);
      return res.json(updatedVehicle);
    } catch (error) {
      console.error('Update vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public deleteVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber } = req.params;
      const userFullName = await this.getUserFullName(req.user.id);

      const vehicle = await this.vehicleRepository.findOne({
        where: { plate_number: plateNumber }
      });

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      if (vehicle.owner_name !== userFullName && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await this.vehicleRepository.remove(vehicle);
      return res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public searchVehicles = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const searchQuery = String(req.query.query || '');
      const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');

      queryBuilder.where(
        '(vehicle.plate_number ILIKE :query OR vehicle.type ILIKE :query OR vehicle.owner_name ILIKE :query)',
        { query: `%${searchQuery}%` }
      );

      if (req.user.role !== UserRole.ADMIN) {
        const userFullName = await this.getUserFullName(req.user.id);
        queryBuilder.andWhere('vehicle.owner_name = :ownerName', { ownerName: userFullName });
      }

      queryBuilder.orderBy('vehicle.plate_number', 'ASC');

      const vehicles = await queryBuilder.getMany();
      return res.json(vehicles);
    } catch (error) {
      console.error('Search vehicles error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}