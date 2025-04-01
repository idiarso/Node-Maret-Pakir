import express from 'express';
import { ParkingSessionController } from '../controllers/parkingSession.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all parking sessions
router.get('/', ParkingSessionController.getAllParkingSessions);

// Get active parking sessions
router.get('/active', ParkingSessionController.getActiveParkingSessions);

// Get parking session by ID
router.get('/:id', ParkingSessionController.getParkingSessionById);

// Create new parking session
router.post('/', ParkingSessionController.createParkingSession);

// Update parking session
router.put('/:id', ParkingSessionController.updateParkingSession);

// Complete parking session
router.put('/:id/complete', ParkingSessionController.completeParkingSession);

export default router; 