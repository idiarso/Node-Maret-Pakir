import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { UserRole } from "../../shared/types";

const router = Router();

// Protected routes
router.get("/", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), VehicleController.getAllVehicles);
router.get("/:id", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), VehicleController.getVehicleById);
router.post("/", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), VehicleController.createVehicle);
router.put("/:id", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), VehicleController.updateVehicle);
router.delete("/:id", authMiddleware([UserRole.ADMIN]), VehicleController.deleteVehicle);

// Vehicle type routes
router.get("/types", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), VehicleController.getVehicleTypes);

// Get vehicle by plate number
router.get("/plate/:plate_number", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), VehicleController.getVehicleByPlateNumber);

export default router; 