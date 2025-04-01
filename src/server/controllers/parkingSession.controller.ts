import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { ParkingSession } from '../entities/ParkingSession';
import { Logger } from '../../shared/services/Logger';
import { Vehicle } from '../entities/Vehicle';
import { ParkingArea } from '../entities/ParkingArea';

const logger = Logger.getInstance();

export class ParkingSessionController {
    
    static async getAllParkingSessions(req: Request, res: Response) {
        try {
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSessions = await parkingSessionRepository.find({
                relations: ['vehicle', 'parkingArea'],
                order: { entry_time: 'DESC' }
            });
            
            return res.status(200).json(parkingSessions);
        } catch (error) {
            logger.error('Error fetching parking sessions:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({ 
                message: 'Error fetching parking sessions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    static async getParkingSessionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSession = await parkingSessionRepository.findOne({ 
                where: { id: Number(id) },
                relations: ['vehicle', 'parkingArea', 'ticket']
            });
            
            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }
            
            return res.status(200).json(parkingSession);
        } catch (error) {
            logger.error(`Error fetching parking session with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error fetching parking session' });
        }
    }

    static async createParkingSession(req: Request, res: Response) {
        try {
            const { vehicleId, parkingAreaId, entryTime } = req.body;
            
            if (!vehicleId || !parkingAreaId) {
                return res.status(400).json({ message: 'Required fields missing' });
            }
            
            // Verify that the vehicle and parking area exist
            const vehicleRepository = AppDataSource.getRepository(Vehicle);
            const vehicle = await vehicleRepository.findOne({ where: { id: Number(vehicleId) } });
            
            if (!vehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }
            
            const parkingAreaRepository = AppDataSource.getRepository(ParkingArea);
            const parkingArea = await parkingAreaRepository.findOne({ where: { id: Number(parkingAreaId) } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: 'Parking area not found' });
            }
            
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const newParkingSession = parkingSessionRepository.create({
                vehicle,
                parkingArea,
                entry_time: entryTime || new Date(),
                status: 'ACTIVE'
            });
            
            const savedParkingSession = await parkingSessionRepository.save(newParkingSession);
            
            return res.status(201).json(savedParkingSession);
        } catch (error) {
            logger.error('Error creating parking session:', error);
            return res.status(500).json({ message: 'Error creating parking session' });
        }
    }

    static async updateParkingSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { vehicleId, parkingAreaId, entryTime, exitTime, status } = req.body;
            
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSession = await parkingSessionRepository.findOne({ 
                where: { id: Number(id) },
                relations: ['vehicle', 'parkingArea']
            });
            
            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }
            
            // Update vehicle if provided
            if (vehicleId) {
                const vehicleRepository = AppDataSource.getRepository(Vehicle);
                const vehicle = await vehicleRepository.findOne({ where: { id: Number(vehicleId) } });
                
                if (!vehicle) {
                    return res.status(404).json({ message: 'Vehicle not found' });
                }
                
                parkingSession.vehicle = vehicle;
            }
            
            // Update parking area if provided
            if (parkingAreaId) {
                const parkingAreaRepository = AppDataSource.getRepository(ParkingArea);
                const parkingArea = await parkingAreaRepository.findOne({ where: { id: Number(parkingAreaId) } });
                
                if (!parkingArea) {
                    return res.status(404).json({ message: 'Parking area not found' });
                }
                
                parkingSession.parkingArea = parkingArea;
            }
            
            // Update other fields if provided
            if (entryTime !== undefined) parkingSession.entry_time = new Date(entryTime);
            if (exitTime !== undefined) parkingSession.exit_time = exitTime ? new Date(exitTime) : undefined;
            if (status !== undefined) parkingSession.status = status;
            
            const updatedParkingSession = await parkingSessionRepository.save(parkingSession);
            
            return res.status(200).json(updatedParkingSession);
        } catch (error) {
            logger.error(`Error updating parking session with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error updating parking session' });
        }
    }

    static async completeParkingSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { exitTime } = req.body;
            
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSession = await parkingSessionRepository.findOne({ where: { id: Number(id) } });
            
            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }
            
            if (parkingSession.status !== 'ACTIVE') {
                return res.status(400).json({ message: 'Parking session is not active' });
            }
            
            parkingSession.exit_time = exitTime ? new Date(exitTime) : new Date();
            parkingSession.status = 'COMPLETED';
            
            const updatedParkingSession = await parkingSessionRepository.save(parkingSession);
            
            return res.status(200).json(updatedParkingSession);
        } catch (error) {
            logger.error(`Error completing parking session with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error completing parking session' });
        }
    }

    static async getActiveParkingSessions(req: Request, res: Response) {
        try {
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const activeSessions = await parkingSessionRepository.find({
                where: { status: 'ACTIVE' },
                relations: ['vehicle', 'parkingArea'],
                order: { entry_time: 'DESC' }
            });
            
            return res.status(200).json(activeSessions);
        } catch (error) {
            logger.error('Error fetching active parking sessions:', error);
            return res.status(500).json({ message: 'Error fetching active parking sessions' });
        }
    }
} 