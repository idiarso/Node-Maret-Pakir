import express from 'express';
import { GateController } from '../controllers/gate.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all gates
router.get('/', GateController.getAllGates);

// Get gate by ID
router.get('/:id', GateController.getGateById);

// Create new gate
router.post('/', GateController.createGate);

// Update gate
router.put('/:id', GateController.updateGate);

// Delete gate
router.delete('/:id', GateController.deleteGate);

// Change gate status
router.post('/:id/status', GateController.changeGateStatus);

// Open gate
router.post('/:id/open', GateController.openGate);

// Close gate
router.post('/:id/close', GateController.closeGate);

export default router; 