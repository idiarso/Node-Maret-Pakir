import { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle';
import { logger } from '../utils/logger';

export class VehicleController {
  async getVehicles(req: Request, res: Response) {
    try {
      const vehicles = await Vehicle.findAll();
      res.json(vehicles);
    } catch (error) {
      logger.error('Error fetching vehicles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await Vehicle.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      res.json(vehicle);
    } catch (error) {
      logger.error('Error fetching vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createVehicle(req: Request, res: Response) {
    try {
      const vehicle = await Vehicle.create(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      logger.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await Vehicle.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      await vehicle.update(req.body);
      res.json(vehicle);
    } catch (error) {
      logger.error('Error updating vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await Vehicle.findByPk(id);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      await vehicle.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 