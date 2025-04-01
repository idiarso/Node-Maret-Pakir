import { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthenticatedRequest, UserRole } from '../shared/types';

export class VehicleController {
  constructor(private db: Pool) {}

  public registerVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber, make, model, color, type } = req.body;
      const ownerId = req.user.id;

      const existingVehicle = await this.db.query(
        'SELECT * FROM vehicles WHERE plate_number = $1',
        [plateNumber]
      );

      if (existingVehicle.rows.length > 0) {
        return res.status(400).json({ message: 'Vehicle already registered' });
      }

      const result = await this.db.query(
        'INSERT INTO vehicles (plate_number, make, model, color, type, owner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [plateNumber, make, model, color, type, ownerId]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Register vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public getVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber } = req.params;
      const query = `
        SELECT v.*, u.name as owner_name 
        FROM vehicles v 
        JOIN users u ON v.owner_id = u.id 
        WHERE v.plate_number = $1
      `;

      const result = await this.db.query(query, [plateNumber]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const vehicle = result.rows[0];
      if (vehicle.owner_id !== req.user.id && req.user.role !== UserRole.ADMIN) {
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
      let query = `
        SELECT v.*, u.name as owner_name 
        FROM vehicles v 
        JOIN users u ON v.owner_id = u.id
      `;
      const params: any[] = [];

      if (req.user.role !== UserRole.ADMIN) {
        query += ' WHERE v.owner_id = $1';
        params.push(req.user.id);
      }

      query += ' ORDER BY v.plate_number';
      const result = await this.db.query(query, params);
      return res.json(result.rows);
    } catch (error) {
      console.error('List vehicles error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public updateVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber } = req.params;
      const updates = {
        make: req.body.make,
        model: req.body.model,
        color: req.body.color,
        type: req.body.type
      };

      const vehicle = await this.db.query(
        'SELECT * FROM vehicles WHERE plate_number = $1',
        [plateNumber]
      );

      if (vehicle.rows.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      if (vehicle.rows[0].owner_id !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const setClause = Object.entries(updates)
        .filter(([_, value]) => value !== undefined)
        .map(([key], index) => `${key} = $${index + 2}`)
        .join(', ');

      if (!setClause) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const values = Object.values(updates).filter(value => value !== undefined);
      const result = await this.db.query(
        `UPDATE vehicles SET ${setClause} WHERE plate_number = $1 RETURNING *`,
        [plateNumber, ...values]
      );

      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Update vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public deleteVehicle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { plateNumber } = req.params;

      const vehicle = await this.db.query(
        'SELECT * FROM vehicles WHERE plate_number = $1',
        [plateNumber]
      );

      if (vehicle.rows.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      if (vehicle.rows[0].owner_id !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await this.db.query('DELETE FROM vehicles WHERE plate_number = $1', [plateNumber]);
      return res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  public searchVehicles = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const searchQuery = String(req.query.query || '');
      let sqlQuery = `
        SELECT v.*, u.name as owner_name 
        FROM vehicles v 
        JOIN users u ON v.owner_id = u.id 
        WHERE (
          v.plate_number ILIKE $1 OR 
          v.make ILIKE $1 OR 
          v.model ILIKE $1 OR 
          v.color ILIKE $1
        )
      `;
      const params: any[] = [`%${searchQuery}%`];

      if (req.user.role !== UserRole.ADMIN) {
        sqlQuery += ' AND v.owner_id = $2';
        params.push(req.user.id);
      }

      sqlQuery += ' ORDER BY v.plate_number';
      const result = await this.db.query(sqlQuery, params);
      return res.json(result.rows);
    } catch (error) {
      console.error('Search vehicles error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
} 