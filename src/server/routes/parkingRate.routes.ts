import { Router } from 'express';
import { ParkingRateController } from '../controllers/parkingRate.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';
import { VehicleType } from '../entities/ParkingRate';

const router = Router();
const controller = ParkingRateController.getInstance();

// Validation schemas
const createRateSchema = {
  body: z.object({
    vehicle_type: z.nativeEnum(VehicleType),
    base_rate: z.number().positive(),
    hourly_rate: z.number().min(0).optional(),
    daily_rate: z.number().positive().optional(),
    weekly_rate: z.number().positive().optional(),
    monthly_rate: z.number().positive().optional(),
    grace_period: z.number().int().min(0).optional(),
    is_weekend_rate: z.boolean().optional(),
    is_holiday_rate: z.boolean().optional(),
    effective_from: z.string().datetime(),
    effective_to: z.string().datetime().optional()
  })
};

const updateRateSchema = {
  params: z.object({
    id: z.string().transform(Number)
  }),
  body: z.object({
    vehicle_type: z.nativeEnum(VehicleType).optional(),
    base_rate: z.number().positive().optional(),
    hourly_rate: z.number().min(0).optional(),
    daily_rate: z.number().positive().optional(),
    weekly_rate: z.number().positive().optional(),
    monthly_rate: z.number().positive().optional(),
    grace_period: z.number().int().min(0).optional(),
    is_weekend_rate: z.boolean().optional(),
    is_holiday_rate: z.boolean().optional(),
    effective_from: z.string().datetime().optional(),
    effective_to: z.string().datetime().optional()
  })
};

const getRateByIdSchema = {
  params: z.object({
    id: z.string().transform(Number)
  })
};

const deleteRateSchema = {
  params: z.object({
    id: z.string().transform(Number)
  })
};

const getActiveRatesSchema = {
  params: z.object({
    vehicleType: z.nativeEnum(VehicleType)
  })
};

// Routes
router.get('/', authMiddleware, controller.getAllRates);

router.get('/:id', 
  authMiddleware, 
  controller.getRateById
);

router.post('/', 
  authMiddleware, 
  controller.createRate
);

router.put('/:id', 
  authMiddleware, 
  controller.updateRate
);

router.delete('/:id', 
  authMiddleware, 
  controller.deleteRate
);

router.get('/active/:vehicleType',
  authMiddleware,
  controller.getActiveRatesByVehicleType
);

export default router; 