import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Vehicle } from '../entities/Vehicle';
import { VehicleType } from '../../shared/types';

const router = Router();

// Get all active vehicles (currently parked)
router.get('/', async (req, res) => {
  try {
    const vehicleRepository = getRepository(Vehicle);
    const vehicles = await vehicleRepository.find({
      where: { isExited: false },
      relations: ['entryOperator', 'exitOperator', 'payment']
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get vehicle by ticket number
router.get('/:ticketNumber', async (req, res) => {
  try {
    const vehicleRepository = getRepository(Vehicle);
    const vehicle = await vehicleRepository.findOne({
      where: { ticketNumber: req.params.ticketNumber },
      relations: ['entryOperator', 'exitOperator', 'payment']
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Register new vehicle entry
router.post('/', async (req, res) => {
  try {
    const { ticketNumber, vehicleType, entryImagePath, operatorId } = req.body;

    const vehicleRepository = getRepository(Vehicle);
    const vehicle = vehicleRepository.create({
      ticketNumber,
      vehicleType: vehicleType as VehicleType,
      entryImagePath,
      entryOperator: { id: operatorId },
      isExited: false
    });

    await vehicleRepository.save(vehicle);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register vehicle entry' });
  }
});

// Update vehicle exit
router.put('/:ticketNumber/exit', async (req, res) => {
  try {
    const { exitImagePath, operatorId } = req.body;
    const vehicleRepository = getRepository(Vehicle);

    const vehicle = await vehicleRepository.findOne({
      where: { ticketNumber: req.params.ticketNumber }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    vehicle.exitImagePath = exitImagePath;
    vehicle.exitOperator = { id: operatorId } as any;
    vehicle.exitTime = new Date();
    vehicle.isExited = true;

    await vehicleRepository.save(vehicle);
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle exit' });
  }
});

export default router; 