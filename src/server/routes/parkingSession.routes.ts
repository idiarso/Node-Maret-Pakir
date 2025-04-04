import express from 'express';
import { ParkingSessionController } from '../controllers/parkingSession.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware());

// Vehicle entry and exit
router.post('/entry', ParkingSessionController.handleVehicleEntry);
router.post('/exit', ParkingSessionController.handleVehicleExit);

// Get all parking sessions
router.get('/', ParkingSessionController.getAllParkingSessions);

// Get active parking sessions
router.get('/active', ParkingSessionController.getActiveParkingSessions);

// Search by barcode
router.get('/search', ParkingSessionController.searchByBarcode);

// Get parking session by ID
router.get('/:id', ParkingSessionController.getParkingSessionById);

// Create new parking session
router.post('/', ParkingSessionController.createParkingSession);

// Update parking session
router.put('/:id', ParkingSessionController.updateParkingSession);

// Complete parking session
router.post('/:id/complete', ParkingSessionController.completeParkingSession);

export default router; 