import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { ParkingRate, VehicleType } from '../entities/ParkingRate';
import { Logger } from '../../shared/services/Logger';
import { CacheService } from '../services/cache.service';
import { IsNull } from 'typeorm';

const logger = Logger.getInstance();
const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
const cacheService = CacheService.getInstance();

export class ParkingRateController {
    
    async getAllRates(req: Request, res: Response) {
        try {
            const rates = await cacheService.getOrSet(
                'parking_rates:all',
                async () => {
                    return await parkingRateRepository.find({
                        order: { vehicle_type: 'ASC' }
                    });
                },
                300 // Cache for 5 minutes
            );

            res.json(rates);
        } catch (error) {
            logger.error('Error fetching parking rates:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getRateById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const rate = await cacheService.getOrSet(
                `parking_rate:${id}`,
                async () => {
                    return await parkingRateRepository.findOneBy({ id: parseInt(id) });
                },
                300 // Cache for 5 minutes
            );

            if (!rate) {
                return res.status(404).json({ message: 'Parking rate not found' });
            }

            res.json(rate);
        } catch (error) {
            logger.error('Error fetching parking rate:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createRate(req: Request, res: Response) {
        try {
            const newRate = parkingRateRepository.create(req.body);
            const savedRate = await parkingRateRepository.save(newRate);

            // Invalidate cache
            await cacheService.invalidatePattern('parking_rates:*');

            res.status(201).json(savedRate);
        } catch (error) {
            logger.error('Error creating parking rate:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateRate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const rate = await parkingRateRepository.findOneBy({ id: parseInt(id) });

            if (!rate) {
                return res.status(404).json({ message: 'Parking rate not found' });
            }

            parkingRateRepository.merge(rate, req.body);
            const updatedRate = await parkingRateRepository.save(rate);

            // Invalidate cache
            await cacheService.invalidatePattern('parking_rates:*');

            res.json(updatedRate);
        } catch (error) {
            logger.error('Error updating parking rate:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deleteRate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const rate = await parkingRateRepository.findOneBy({ id: parseInt(id) });

            if (!rate) {
                return res.status(404).json({ message: 'Parking rate not found' });
            }

            await parkingRateRepository.remove(rate);

            // Invalidate cache
            await cacheService.invalidatePattern('parking_rates:*');

            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting parking rate:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getActiveRatesByVehicleType(req: Request, res: Response) {
        try {
            const { vehicleType } = req.params;
            const now = new Date();

            // Validate vehicle type
            if (!Object.values(VehicleType).includes(vehicleType as VehicleType)) {
                return res.status(400).json({ 
                    message: `Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}` 
                });
            }

            const rates = await cacheService.getOrSet(
                `parking_rates:active:${vehicleType}`,
                async () => {
                    return await parkingRateRepository.find({
                        where: {
                            vehicle_type: vehicleType as VehicleType,
                            effective_from: now,
                            effective_to: IsNull()
                        },
                        order: { created_at: 'DESC' }
                    });
                },
                300 // Cache for 5 minutes
            );

            res.json(rates);
        } catch (error) {
            logger.error('Error fetching active rates:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
} 