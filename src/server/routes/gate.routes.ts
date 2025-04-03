import express from 'express';
import { GateController } from '../controllers/gate.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const gateController = new GateController();

// Apply auth middleware to all routes
// Temporary disable auth for testing
// router.use(authMiddleware);

// Get all gates
router.get('/', (req, res) => gateController.getAllGates(req, res));

// Get gate by ID
router.get('/:id', (req, res) => gateController.getGateById(req, res));

// Create new gate
router.post('/', (req, res) => gateController.createGate(req, res));

// Update gate
router.put('/:id', (req, res) => gateController.updateGate(req, res));

// Delete gate
router.delete('/:id', (req, res) => gateController.deleteGate(req, res));

// Change gate status
router.put('/:id/status', (req, res) => gateController.changeGateStatus(req, res));

// Open gate
router.post('/:id/open', GateController.openGate);

// Close gate
router.post('/:id/close', GateController.closeGate);

export default router; 