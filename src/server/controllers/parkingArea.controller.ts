import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { ParkingArea } from "../entities/ParkingArea";
import { Logger } from "../../shared/services/Logger";

const logger = Logger.getInstance();

export class ParkingAreaController {
    private static instance: ParkingAreaController;
    private parkingAreaRepository = AppDataSource.getRepository(ParkingArea);

    private constructor() {}

    public static getInstance(): ParkingAreaController {
        if (!ParkingAreaController.instance) {
            ParkingAreaController.instance = new ParkingAreaController();
        }
        return ParkingAreaController.instance;
    }

    // Get all parking areas
    public async getAllParkingAreas(req: Request, res: Response) {
        try {
            const parkingAreas = await this.parkingAreaRepository.find();
            res.json(parkingAreas);
        } catch (error) {
            logger.error("Error fetching parking areas:", error);
            res.status(500).json({ message: "Error fetching parking areas", error });
        }
    }

    // Get parking area by ID
    public async getParkingAreaById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const parkingArea = await this.parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }
            
            res.json(parkingArea);
        } catch (error) {
            logger.error("Error fetching parking area:", error);
            res.status(500).json({ message: "Error fetching parking area", error });
        }
    }

    // Create new parking area
    public async createParkingArea(req: Request, res: Response) {
        try {
            const { name, location, capacity, status } = req.body;
            
            if (!name || !location || !capacity) {
                return res.status(400).json({ message: "Name, location, and capacity are required" });
            }

            // Validate capacity
            const capacityNum = parseInt(capacity);
            if (isNaN(capacityNum) || capacityNum <= 0) {
                return res.status(400).json({ message: "Capacity must be a positive number" });
            }

            // Validate status
            const validStatuses = ['active', 'inactive', 'maintenance'];
            const normalizedStatus = (status || 'active').toLowerCase();
            if (!validStatuses.includes(normalizedStatus)) {
                return res.status(400).json({ message: "Invalid status. Must be one of: active, inactive, maintenance" });
            }

            const parkingArea = this.parkingAreaRepository.create({
                name,
                location,
                capacity: capacityNum,
                occupied: 0,
                status: normalizedStatus
            });

            await this.parkingAreaRepository.save(parkingArea);
            res.status(201).json(parkingArea);
        } catch (error: any) {
            logger.error('Error creating parking area:', error);
            res.status(500).json({ 
                message: "Error creating parking area", 
                error: error.message || 'Unknown error occurred' 
            });
        }
    }

    // Update parking area
    public async updateParkingArea(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { name, capacity, status } = req.body;

            const parkingArea = await this.parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }

            if (name) parkingArea.name = name;
            if (capacity) {
                const capacityNum = parseInt(capacity);
                if (isNaN(capacityNum) || capacityNum <= 0) {
                    return res.status(400).json({ message: "Capacity must be a positive number" });
                }
                parkingArea.capacity = capacityNum;
            }
            if (status) {
                const validStatuses = ['active', 'inactive', 'maintenance'];
                const normalizedStatus = status.toLowerCase();
                if (!validStatuses.includes(normalizedStatus)) {
                    return res.status(400).json({ message: "Invalid status. Must be one of: active, inactive, maintenance" });
                }
                parkingArea.status = normalizedStatus;
            }

            await this.parkingAreaRepository.save(parkingArea);
            res.json(parkingArea);
        } catch (error: any) {
            logger.error('Error updating parking area:', error);
            res.status(500).json({ 
                message: "Error updating parking area", 
                error: error.message || 'Unknown error occurred' 
            });
        }
    }

    // Delete parking area
    public async deleteParkingArea(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const parkingArea = await this.parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }

            await this.parkingAreaRepository.remove(parkingArea);
            res.json({ message: "Parking area deleted successfully" });
        } catch (error) {
            logger.error('Error deleting parking area:', error);
            res.status(500).json({ message: "Error deleting parking area", error });
        }
    }

    // Update parking area occupancy
    public async updateOccupancy(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { occupied } = req.body;

            if (typeof occupied !== 'number') {
                return res.status(400).json({ message: "Occupancy must be a number" });
            }

            const parkingArea = await this.parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }

            if (occupied > parkingArea.capacity) {
                return res.status(400).json({ message: "Occupancy cannot exceed capacity" });
            }

            parkingArea.occupied = occupied;
            await this.parkingAreaRepository.save(parkingArea);
            res.json(parkingArea);
        } catch (error) {
            logger.error('Error updating occupancy:', error);
            res.status(500).json({ message: "Error updating occupancy", error });
        }
    }
} 