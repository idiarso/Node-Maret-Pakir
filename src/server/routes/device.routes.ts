import { Router } from "express";
import { DeviceController } from "../controllers/device.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { UserRole } from "../../shared/types";

const router = Router();
const deviceController = DeviceController.getInstance();

// Protected routes - Admin only
router.get("/", authMiddleware([UserRole.ADMIN]), deviceController.getAllDevices.bind(deviceController));
router.get("/:id", authMiddleware([UserRole.ADMIN]), deviceController.getDeviceById.bind(deviceController));
router.post("/", authMiddleware([UserRole.ADMIN]), deviceController.createDevice.bind(deviceController));
router.put("/:id", authMiddleware([UserRole.ADMIN]), deviceController.updateDevice.bind(deviceController));
router.delete("/:id", authMiddleware([UserRole.ADMIN]), deviceController.deleteDevice.bind(deviceController));

// Health check routes
router.get("/:id/health-checks", authMiddleware([UserRole.ADMIN]), deviceController.getDeviceHealthChecks.bind(deviceController));
router.post("/:id/health-check", authMiddleware([UserRole.ADMIN]), deviceController.performHealthCheck.bind(deviceController));

export default router; 