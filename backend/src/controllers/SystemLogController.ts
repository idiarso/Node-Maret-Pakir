import { Request, Response } from 'express';
import { SystemLog } from '../models/SystemLog';
import { logger } from '../utils/logger';

export class SystemLogController {
  async getLogs(req: Request, res: Response) {
    try {
      const { level, category, startDate, endDate } = req.query;
      const where: any = {};

      if (level) where.level = level;
      if (category) where.category = category;
      if (startDate && endDate) {
        where.timestamp = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const logs = await SystemLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: 1000,
      });
      res.json(logs);
    } catch (error) {
      logger.error('Error fetching system logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createLog(req: Request, res: Response) {
    try {
      const log = await SystemLog.create({
        ...req.body,
        timestamp: new Date(),
      });
      res.status(201).json(log);
    } catch (error) {
      logger.error('Error creating system log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async clearLogs(req: Request, res: Response) {
    try {
      await SystemLog.destroy({ where: {} });
      res.status(204).send();
    } catch (error) {
      logger.error('Error clearing system logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 