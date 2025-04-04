import { Router } from 'express';
import { GateController } from '../controllers/gate.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../shared/types';

const router = Router();
const gateController = GateController.getInstance();

// Protected routes
router.get('/', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => gateController.getAllGates(req, res));
router.get('/:id', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => gateController.getGateById(req, res));
router.post('/', authMiddleware([UserRole.ADMIN]), (req, res) => gateController.createGate(req, res));
router.put('/:id', authMiddleware([UserRole.ADMIN]), (req, res) => gateController.updateGate(req, res));
router.delete('/:id', authMiddleware([UserRole.ADMIN]), (req, res) => gateController.deleteGate(req, res));

// Gate control routes
router.post('/:id/open', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), GateController.openGate);
router.post('/:id/close', authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), GateController.closeGate);

export default router; 