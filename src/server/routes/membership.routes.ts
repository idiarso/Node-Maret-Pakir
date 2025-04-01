import { Router } from "express";
import { MembershipController } from "../controllers/membership.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Get all memberships
router.get("/", authenticateToken, MembershipController.getAllMemberships);

// Get active memberships
router.get("/active", authenticateToken, MembershipController.getActiveMemberships);

// Get membership by ID
router.get("/:id", authenticateToken, MembershipController.getMembershipById);

// Get memberships by vehicle ID
router.get("/vehicle/:vehicle_id", authenticateToken, MembershipController.getMembershipsByVehicle);

// Create new membership
router.post("/", authenticateToken, MembershipController.createMembership);

// Update membership
router.put("/:id", authenticateToken, MembershipController.updateMembership);

// Delete membership
router.delete("/:id", authenticateToken, MembershipController.deleteMembership);

export default router; 