import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Get all vehicles
router.get("/", authenticateToken, VehicleController.getAllVehicles);

// Get vehicle by ID
router.get("/:id", authenticateToken, VehicleController.getVehicleById);

// Get vehicle by plate number
router.get("/plate/:plate_number", authenticateToken, VehicleController.getVehicleByPlateNumber);

// Create new vehicle
router.post("/", authenticateToken, VehicleController.createVehicle);

// Update vehicle
router.put("/:id", authenticateToken, VehicleController.updateVehicle);

// Delete vehicle
router.delete("/:id", authenticateToken, VehicleController.deleteVehicle);

export default router; 