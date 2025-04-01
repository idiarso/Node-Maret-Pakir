import { Router } from 'express';
import { ParkingRateController } from '../controllers/parkingRate.controller';
import AppDataSource from '../config/ormconfig';
import { ParkingRate, VehicleType } from '../entities/ParkingRate';

const router = Router();
const parkingRateController = new ParkingRateController();

// Debug endpoint to create a test parking rate
router.get('/debug-create', async (req, res) => {
    try {
        const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
        const newRate = parkingRateRepository.create({
            vehicle_type: 'MOTORCYCLE', // Updated to use the correct enum value
            base_rate: 2500,
            hourly_rate: 1000,
            daily_rate: 10000,
            effective_from: new Date('2025-01-01')
        });

        const result = await parkingRateRepository.save(newRate);
        return res.json(result);
    } catch (error) {
        console.error('Debug create error:', error);
        return res.status(500).json({ error: String(error) });
    }
});

// Debug endpoint to create sample parking rates for all vehicle types
router.get('/create-samples', async (req, res) => {
    try {
        const parkingRateRepository = AppDataSource.getRepository(ParkingRate);
        
        const rates = [
            {
                vehicle_type: VehicleType.CAR,
                base_rate: 5000,
                hourly_rate: 2000,
                daily_rate: 20000,
                effective_from: new Date('2025-01-01')
            },
            {
                vehicle_type: VehicleType.MOTORCYCLE,
                base_rate: 2500,
                hourly_rate: 1000,
                daily_rate: 10000,
                effective_from: new Date('2025-01-01')
            },
            {
                vehicle_type: VehicleType.TRUCK,
                base_rate: 10000,
                hourly_rate: 5000,
                daily_rate: 50000,
                effective_from: new Date('2025-01-01')
            },
            {
                vehicle_type: VehicleType.VAN,
                base_rate: 7500,
                hourly_rate: 3000,
                daily_rate: 30000,
                effective_from: new Date('2025-01-01')
            }
        ];
        
        // Insert or update rates
        const results = [];
        for (const rate of rates) {
            // Check if rate already exists for this vehicle type
            const existing = await parkingRateRepository.findOne({
                where: { vehicle_type: rate.vehicle_type }
            });
            
            if (existing) {
                // Update existing
                Object.assign(existing, rate);
                results.push(await parkingRateRepository.save(existing));
            } else {
                // Create new
                results.push(await parkingRateRepository.save(parkingRateRepository.create(rate)));
            }
        }
        
        return res.json(results);
    } catch (error) {
        console.error('Error creating sample rates:', error);
        return res.status(500).json({ error: String(error) });
    }
});

// Get all parking rates
router.get('/', parkingRateController.getAllParkingRates);

// Get a specific parking rate by ID
router.get('/:id', parkingRateController.getParkingRateById);

// Create a new parking rate
router.post('/', parkingRateController.createParkingRate);

// Update an existing parking rate
router.put('/:id', parkingRateController.updateParkingRate);

// Delete a parking rate
router.delete('/:id', parkingRateController.deleteParkingRate);

export default router; 