import { Router } from "express";
import { ParkingAreaController } from "../controllers/parkingArea.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { UserRole } from "../../shared/types";

const router = Router();
const parkingAreaController = ParkingAreaController.getInstance();

// Protected routes
router.get("/", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => parkingAreaController.getAllParkingAreas(req, res));
router.get("/:id", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => parkingAreaController.getParkingAreaById(req, res));
router.post("/", authMiddleware([UserRole.ADMIN]), (req, res) => parkingAreaController.createParkingArea(req, res));
router.put("/:id", authMiddleware([UserRole.ADMIN]), (req, res) => parkingAreaController.updateParkingArea(req, res));
router.delete("/:id", authMiddleware([UserRole.ADMIN]), (req, res) => parkingAreaController.deleteParkingArea(req, res));

// Occupancy routes
router.patch("/:id/occupancy", authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]), (req, res) => parkingAreaController.updateOccupancy(req, res));

export default router; 