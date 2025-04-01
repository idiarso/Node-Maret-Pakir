import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { ParkingRate, VehicleType } from '../entities/ParkingRate';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export class ParkingRateController {
    
    async getAllParkingRates(req: Request, res: Response) {
        try {
            const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
            const parkingRates = await parkingRateRepository.find();
            
            return res.status(200).json(parkingRates);
        } catch (error) {
            logger.error('Error fetching parking rates:', error);
            return res.status(500).json({ message: 'Error fetching parking rates' });
        }
    }

    async getParkingRateById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
            const parkingRate = await parkingRateRepository.findOne({ where: { id: Number(id) } });
            
            if (!parkingRate) {
                return res.status(404).json({ message: 'Parking rate not found' });
            }
            
            return res.status(200).json(parkingRate);
        } catch (error) {
            logger.error(`Error fetching parking rate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error fetching parking rate' });
        }
    }

    async createParkingRate(req: Request, res: Response) {
        try {
            const { 
                vehicle_type, 
                base_rate, 
                hourly_rate, 
                daily_rate,
                weekly_rate,
                monthly_rate,
                grace_period,
                is_weekend_rate,
                is_holiday_rate,
                effective_from,
                effective_to
            } = req.body;
            
            if (!vehicle_type || !base_rate || !effective_from) {
                return res.status(400).json({ message: 'Required fields missing' });
            }
            
            // Validate that vehicle_type is a valid enum value
            if (!Object.values(VehicleType).includes(vehicle_type as VehicleType)) {
                return res.status(400).json({ 
                    message: `Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}` 
                });
            }
            
            const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
            const newParkingRate = parkingRateRepository.create({
                vehicle_type,
                base_rate,
                hourly_rate: hourly_rate || 0,
                daily_rate,
                weekly_rate,
                monthly_rate,
                grace_period,
                is_weekend_rate,
                is_holiday_rate,
                effective_from: new Date(effective_from),
                effective_to: effective_to ? new Date(effective_to) : undefined
            });
            
            const savedParkingRate = await parkingRateRepository.save(newParkingRate);
            
            return res.status(201).json(savedParkingRate);
        } catch (error) {
            logger.error('Error creating parking rate:', error);
            return res.status(500).json({ message: 'Error creating parking rate' });
        }
    }

    async updateParkingRate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { 
                vehicle_type, 
                base_rate, 
                hourly_rate, 
                daily_rate,
                weekly_rate,
                monthly_rate,
                grace_period,
                is_weekend_rate,
                is_holiday_rate,
                effective_from,
                effective_to
            } = req.body;
            
            // Validate that vehicle_type is a valid enum value if provided
            if (vehicle_type && !Object.values(VehicleType).includes(vehicle_type as VehicleType)) {
                return res.status(400).json({ 
                    message: `Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}` 
                });
            }
            
            const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
            const parkingRate = await parkingRateRepository.findOne({ where: { id: Number(id) } });
            
            if (!parkingRate) {
                return res.status(404).json({ message: 'Parking rate not found' });
            }
            
            // Update fields if they are provided
            if (vehicle_type !== undefined) parkingRate.vehicle_type = vehicle_type;
            if (base_rate !== undefined) parkingRate.base_rate = base_rate;
            if (hourly_rate !== undefined) parkingRate.hourly_rate = hourly_rate;
            if (daily_rate !== undefined) parkingRate.daily_rate = daily_rate;
            if (weekly_rate !== undefined) parkingRate.weekly_rate = weekly_rate;
            if (monthly_rate !== undefined) parkingRate.monthly_rate = monthly_rate;
            if (grace_period !== undefined) parkingRate.grace_period = grace_period;
            if (is_weekend_rate !== undefined) parkingRate.is_weekend_rate = is_weekend_rate;
            if (is_holiday_rate !== undefined) parkingRate.is_holiday_rate = is_holiday_rate;
            if (effective_from !== undefined) parkingRate.effective_from = new Date(effective_from);
            if (effective_to !== undefined) parkingRate.effective_to = effective_to ? new Date(effective_to) : undefined;
            
            const updatedParkingRate = await parkingRateRepository.save(parkingRate);
            
            return res.status(200).json(updatedParkingRate);
        } catch (error) {
            logger.error(`Error updating parking rate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error updating parking rate' });
        }
    }

    async deleteParkingRate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
            const parkingRate = await parkingRateRepository.findOne({ where: { id: Number(id) } });
            
            if (!parkingRate) {
                return res.status(404).json({ message: 'Parking rate not found' });
            }
            
            await parkingRateRepository.remove(parkingRate);
            
            return res.status(200).json({ message: 'Parking rate deleted successfully' });
        } catch (error) {
            logger.error(`Error deleting parking rate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error deleting parking rate' });
        }
    }
} 