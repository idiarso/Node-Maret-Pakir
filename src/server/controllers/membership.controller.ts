import { Request, Response } from "express";
import AppDataSource from "../config/ormconfig";
import { Membership } from "../entities/Membership";
import { Vehicle } from "../entities/Vehicle";

const membershipRepository = AppDataSource.getRepository(Membership);
const vehicleRepository = AppDataSource.getRepository(Vehicle);

export class MembershipController {
    private static instance: MembershipController;

    private constructor() {}

    public static getInstance(): MembershipController {
        if (!MembershipController.instance) {
            MembershipController.instance = new MembershipController();
        }
        return MembershipController.instance;
    }

    // Get all memberships
    async getAllMemberships(req: Request, res: Response) {
        try {
            const memberships = await membershipRepository.find({
                relations: ["vehicle"]
            });
            res.json(memberships);
        } catch (error) {
            res.status(500).json({ message: "Error fetching memberships", error });
        }
    }

    // Get membership by ID
    async getMembershipById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const membership = await membershipRepository.findOne({
                where: { id },
                relations: ["vehicle"]
            });
            
            if (!membership) {
                return res.status(404).json({ message: "Membership not found" });
            }
            
            res.json(membership);
        } catch (error) {
            res.status(500).json({ message: "Error fetching membership", error });
        }
    }

    // Create new membership
    async createMembership(req: Request, res: Response) {
        try {
            const { vehicle_id, type, start_date, end_date } = req.body;
            
            if (!vehicle_id || !type || !start_date) {
                return res.status(400).json({ message: "Vehicle ID, type, and start date are required" });
            }

            // Check if vehicle exists
            const vehicle = await vehicleRepository.findOne({ where: { id: vehicle_id } });
            if (!vehicle) {
                return res.status(404).json({ message: "Vehicle not found" });
            }

            // Check for active membership
            const activeMembership = await membershipRepository.findOne({
                where: {
                    vehicleId: vehicle_id,
                    active: true
                }
            });

            if (activeMembership) {
                return res.status(400).json({ message: "Vehicle already has an active membership" });
            }

            const membershipData = {
                vehicleId: vehicle_id,
                type,
                start_date: new Date(start_date),
                active: true
            } as Partial<Membership>;

            if (end_date) {
                membershipData.end_date = new Date(end_date);
            }

            const membership = membershipRepository.create(membershipData);

            await membershipRepository.save(membership);
            res.status(201).json(membership);
        } catch (error) {
            res.status(500).json({ message: "Error creating membership", error });
        }
    }

    // Update membership
    async updateMembership(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { type, start_date, end_date, active } = req.body;

            const membership = await membershipRepository.findOne({ where: { id } });
            
            if (!membership) {
                return res.status(404).json({ message: "Membership not found" });
            }

            if (type) membership.type = type;
            if (start_date) membership.start_date = new Date(start_date);
            if (end_date) membership.end_date = new Date(end_date);
            if (active !== undefined) membership.active = active;

            await membershipRepository.save(membership);
            res.json(membership);
        } catch (error) {
            res.status(500).json({ message: "Error updating membership", error });
        }
    }

    // Delete membership
    async deleteMembership(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const membership = await membershipRepository.findOne({ where: { id } });
            
            if (!membership) {
                return res.status(404).json({ message: "Membership not found" });
            }

            await membershipRepository.remove(membership);
            res.json({ message: "Membership deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting membership", error });
        }
    }

    // Get active memberships
    async getActiveMemberships(req: Request, res: Response) {
        try {
            const memberships = await membershipRepository.find({
                where: { active: true },
                relations: ["vehicle"]
            });
            res.json(memberships);
        } catch (error) {
            res.status(500).json({ message: "Error fetching active memberships", error });
        }
    }

    // Get memberships by vehicle ID
    async getMembershipsByVehicle(req: Request, res: Response) {
        try {
            const vehicle_id = parseInt(req.params.vehicle_id);
            const memberships = await membershipRepository.find({
                where: { vehicle: { id: vehicle_id } },
                relations: ["vehicle"]
            });
            res.json(memberships);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vehicle memberships", error });
        }
    }
} 