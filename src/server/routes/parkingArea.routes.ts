import { Router } from "express";
import { ParkingAreaController } from "../controllers/parkingArea.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Get all parking areas
router.get("/", authenticateToken, ParkingAreaController.getAllParkingAreas);

// Get parking area by ID
router.get("/:id", authenticateToken, ParkingAreaController.getParkingAreaById);

// Create new parking area
router.post("/", authenticateToken, ParkingAreaController.createParkingArea);

// Update parking area
router.put("/:id", authenticateToken, ParkingAreaController.updateParkingArea);

// Delete parking area
router.delete("/:id", authenticateToken, ParkingAreaController.deleteParkingArea);

// Update parking area occupancy
router.patch("/:id/occupancy", authenticateToken, ParkingAreaController.updateOccupancy);

export default router; 