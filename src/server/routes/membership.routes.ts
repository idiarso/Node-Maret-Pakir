import { Router } from "express";
import { MembershipController } from "../controllers/membership.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { UserRole } from "../../shared/types";

const router = Router();
const membershipController = MembershipController.getInstance();

// Protect all routes with auth middleware
router.use(authMiddleware([UserRole.ADMIN, UserRole.OPERATOR]));

// Get all memberships
router.get("/", membershipController.getAllMemberships.bind(membershipController));

// Get active memberships
router.get("/active", membershipController.getActiveMemberships.bind(membershipController));

// Get membership by ID
router.get("/:id", membershipController.getMembershipById.bind(membershipController));

// Get memberships by vehicle ID
router.get("/vehicle/:vehicle_id", membershipController.getMembershipsByVehicle.bind(membershipController));

// Create new membership
router.post("/", membershipController.createMembership.bind(membershipController));

// Update membership
router.put("/:id", membershipController.updateMembership.bind(membershipController));

// Delete membership
router.delete("/:id", membershipController.deleteMembership.bind(membershipController));

export default router; 