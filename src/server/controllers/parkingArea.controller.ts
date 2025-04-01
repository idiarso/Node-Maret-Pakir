import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { ParkingArea } from "../entities/ParkingArea";

const parkingAreaRepository = AppDataSource.getRepository(ParkingArea);

export class ParkingAreaController {
    // Get all parking areas
    static async getAllParkingAreas(req: Request, res: Response) {
        try {
            const parkingAreas = await parkingAreaRepository.find();
            res.json(parkingAreas);
        } catch (error) {
            res.status(500).json({ message: "Error fetching parking areas", error });
        }
    }

    // Get parking area by ID
    static async getParkingAreaById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const parkingArea = await parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }
            
            res.json(parkingArea);
        } catch (error) {
            res.status(500).json({ message: "Error fetching parking area", error });
        }
    }

    // Create new parking area
    static async createParkingArea(req: Request, res: Response) {
        try {
            const { name, capacity } = req.body;
            
            if (!name || !capacity) {
                return res.status(400).json({ message: "Name and capacity are required" });
            }

            const parkingArea = parkingAreaRepository.create({
                name,
                capacity,
                occupied: 0,
                status: "ACTIVE"
            });

            await parkingAreaRepository.save(parkingArea);
            res.status(201).json(parkingArea);
        } catch (error) {
            res.status(500).json({ message: "Error creating parking area", error });
        }
    }

    // Update parking area
    static async updateParkingArea(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { name, capacity, status } = req.body;

            const parkingArea = await parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }

            if (name) parkingArea.name = name;
            if (capacity) parkingArea.capacity = capacity;
            if (status) parkingArea.status = status;

            await parkingAreaRepository.save(parkingArea);
            res.json(parkingArea);
        } catch (error) {
            res.status(500).json({ message: "Error updating parking area", error });
        }
    }

    // Delete parking area
    static async deleteParkingArea(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const parkingArea = await parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }

            await parkingAreaRepository.remove(parkingArea);
            res.json({ message: "Parking area deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting parking area", error });
        }
    }

    // Update parking area occupancy
    static async updateOccupancy(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { occupied } = req.body;

            if (typeof occupied !== 'number') {
                return res.status(400).json({ message: "Occupancy must be a number" });
            }

            const parkingArea = await parkingAreaRepository.findOne({ where: { id } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: "Parking area not found" });
            }

            if (occupied > parkingArea.capacity) {
                return res.status(400).json({ message: "Occupancy cannot exceed capacity" });
            }

            parkingArea.occupied = occupied;
            await parkingAreaRepository.save(parkingArea);
            res.json(parkingArea);
        } catch (error) {
            res.status(500).json({ message: "Error updating occupancy", error });
        }
    }
} 