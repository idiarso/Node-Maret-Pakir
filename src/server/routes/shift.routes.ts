import express from 'express';
import { ShiftController } from '../controllers/shift.controller';

const router = express.Router();

// GET all shifts
router.get('/', ShiftController.getAllShifts);

// GET shift by ID
router.get('/:id', ShiftController.getShiftById);

// POST create new shift
router.post('/', ShiftController.createShift);

// POST complete a shift
router.post('/:id/complete', ShiftController.completeShift);

// PUT update shift
router.put('/:id', ShiftController.updateShift);

// DELETE shift
router.delete('/:id', ShiftController.deleteShift);

export default router; 