import { Router } from "express";
import { DeviceController } from "../controllers/device.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Get all devices
router.get("/", authenticateToken, DeviceController.getAllDevices);

// Get device by ID
router.get("/:id", authenticateToken, DeviceController.getDeviceById);

// Create new device
router.post("/", authenticateToken, DeviceController.createDevice);

// Update device
router.put("/:id", authenticateToken, DeviceController.updateDevice);

// Delete device
router.delete("/:id", authenticateToken, DeviceController.deleteDevice);

// Perform health check
router.post("/:id/health-check", authenticateToken, DeviceController.performHealthCheck);

// Get device logs
router.get("/:id/logs", authenticateToken, DeviceController.getDeviceLogs);

// Get device health checks
router.get("/:id/health-checks", authenticateToken, DeviceController.getDeviceHealthChecks);

export default router; 