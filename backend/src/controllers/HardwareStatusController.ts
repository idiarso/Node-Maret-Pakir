import { Request, Response } from 'express';
import { HardwareStatus } from '../models/HardwareStatus';
import { logger } from '../utils/logger';

export class HardwareStatusController {
  async getStatus(req: Request, res: Response) {
    try {
      const status = await HardwareStatus.findAll({
        order: [['lastUpdate', 'DESC']],
      });
      res.json(status);
    } catch (error) {
      logger.error('Error fetching hardware status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getDeviceStatus(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const status = await HardwareStatus.findOne({
        where: { deviceId },
        order: [['lastUpdate', 'DESC']],
      });
      if (!status) {
        return res.status(404).json({ error: 'Status not found' });
      }
      res.json(status);
    } catch (error) {
      logger.error('Error fetching device status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const status = await HardwareStatus.create({
        ...req.body,
        deviceId,
        lastUpdate: new Date(),
      });
      res.json(status);
    } catch (error) {
      logger.error('Error updating hardware status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 