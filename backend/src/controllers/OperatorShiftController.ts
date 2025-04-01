import { Request, Response } from 'express';
import { OperatorShift } from '../models/OperatorShift';
import { logger } from '../utils/logger';

export class OperatorShiftController {
  async getShifts(req: Request, res: Response) {
    try {
      const shifts = await OperatorShift.findAll({
        order: [['startTime', 'DESC']],
      });
      res.json(shifts);
    } catch (error) {
      logger.error('Error fetching operator shifts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCurrentShift(req: Request, res: Response) {
    try {
      const shift = await OperatorShift.findOne({
        where: { status: 'active' },
      });
      if (!shift) {
        return res.status(404).json({ error: 'No active shift found' });
      }
      res.json(shift);
    } catch (error) {
      logger.error('Error fetching current shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async startShift(req: Request, res: Response) {
    try {
      const shift = await OperatorShift.create({
        ...req.body,
        startTime: new Date(),
        status: 'active',
      });
      res.status(201).json(shift);
    } catch (error) {
      logger.error('Error starting shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async endShift(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shift = await OperatorShift.findByPk(id);
      if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
      }
      await shift.update({
        endTime: new Date(),
        status: 'completed',
      });
      res.json(shift);
    } catch (error) {
      logger.error('Error ending shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateShift(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shift = await OperatorShift.findByPk(id);
      if (!shift) {
        return res.status(404).json({ error: 'Shift not found' });
      }
      await shift.update(req.body);
      res.json(shift);
    } catch (error) {
      logger.error('Error updating shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 