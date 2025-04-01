import { Request, Response } from "express";
import AppDataSource from "../config/ormconfig";
import { Vehicle } from "../entities/Vehicle";

const vehicleRepository = AppDataSource.getRepository(Vehicle);

export class VehicleController {
    // Get all vehicles
    static async getAllVehicles(req: Request, res: Response) {
        try {
            const vehicles = await vehicleRepository.find({
                relations: ["parkingSessions", "memberships"]
            });
            res.json(vehicles);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vehicles", error });
        }
    }

    // Get vehicle by ID
    static async getVehicleById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const vehicle = await vehicleRepository.findOne({
                where: { id },
                relations: ["parkingSessions", "memberships"]
            });
            
            if (!vehicle) {
                return res.status(404).json({ message: "Vehicle not found" });
            }
            
            res.json(vehicle);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vehicle", error });
        }
    }

    // Create new vehicle
    static async createVehicle(req: Request, res: Response) {
        try {
            const { plate_number, type, owner_name, owner_contact } = req.body;
            
            if (!plate_number || !type) {
                return res.status(400).json({ message: "Plate number and type are required" });
            }

            // Check if vehicle with same plate number already exists
            const existingVehicle = await vehicleRepository.findOne({
                where: { plate_number }
            });

            if (existingVehicle) {
                return res.status(400).json({ message: "Vehicle with this plate number already exists" });
            }

            const vehicle = vehicleRepository.create({
                plate_number,
                type,
                owner_name,
                owner_contact,
                registration_date: new Date()
            });

            await vehicleRepository.save(vehicle);
            res.status(201).json(vehicle);
        } catch (error) {
            res.status(500).json({ message: "Error creating vehicle", error });
        }
    }

    // Update vehicle
    static async updateVehicle(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { plate_number, type, owner_name, owner_contact } = req.body;

            const vehicle = await vehicleRepository.findOne({ where: { id } });
            
            if (!vehicle) {
                return res.status(404).json({ message: "Vehicle not found" });
            }

            // If plate number is being updated, check for duplicates
            if (plate_number && plate_number !== vehicle.plate_number) {
                const existingVehicle = await vehicleRepository.findOne({
                    where: { plate_number }
                });

                if (existingVehicle) {
                    return res.status(400).json({ message: "Vehicle with this plate number already exists" });
                }
            }

            if (plate_number) vehicle.plate_number = plate_number;
            if (type) vehicle.type = type;
            if (owner_name) vehicle.owner_name = owner_name;
            if (owner_contact) vehicle.owner_contact = owner_contact;

            await vehicleRepository.save(vehicle);
            res.json(vehicle);
        } catch (error) {
            res.status(500).json({ message: "Error updating vehicle", error });
        }
    }

    // Delete vehicle
    static async deleteVehicle(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const vehicle = await vehicleRepository.findOne({ where: { id } });
            
            if (!vehicle) {
                return res.status(404).json({ message: "Vehicle not found" });
            }

            await vehicleRepository.remove(vehicle);
            res.json({ message: "Vehicle deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting vehicle", error });
        }
    }

    // Get vehicle by plate number
    static async getVehicleByPlateNumber(req: Request, res: Response) {
        try {
            const { plate_number } = req.params;
            const vehicle = await vehicleRepository.findOne({
                where: { plate_number },
                relations: ["parkingSessions", "memberships"]
            });
            
            if (!vehicle) {
                return res.status(404).json({ message: "Vehicle not found" });
            }
            
            res.json(vehicle);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vehicle", error });
        }
    }
} 