import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { Gate, GateType, GateStatus } from '../entities/Gate';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export class GateController {
    
    static async getAllGates(req: Request, res: Response) {
        try {
            const gateRepository = AppDataSource.getRepository(Gate);
            const gates = await gateRepository.find();
            
            return res.status(200).json(gates);
        } catch (error) {
            logger.error('Error fetching gates:', error);
            return res.status(500).json({ message: 'Error fetching gates' });
        }
    }

    static async getGateById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            return res.status(200).json(gate);
        } catch (error) {
            logger.error(`Error fetching gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error fetching gate' });
        }
    }

    static async createGate(req: Request, res: Response) {
        try {
            logger.info('Creating gate with data:', req.body);
            const { name, type, location, status, gate_number, description, is_active } = req.body;
            
            // Validasi dasar
            if (!name) {
                return res.status(400).json({ message: 'Gate name is required' });
            }
            
            const gateRepository = AppDataSource.getRepository(Gate);
            
            // Buat gate baru dengan data yang diberikan
            const newGate = new Gate();
            newGate.name = name;
            newGate.gate_number = gate_number || name.substring(0, 20); // Gunakan name sebagai default
            newGate.type = type || GateType.ENTRY;
            newGate.location = location;
            newGate.status = status || GateStatus.INACTIVE;
            newGate.description = description;
            newGate.is_active = is_active === undefined ? true : is_active;
            
            logger.info('Gate object created:', newGate);
            
            // Simpan gate baru
            const savedGate = await gateRepository.save(newGate);
            logger.info('Gate saved successfully:', savedGate);
            
            return res.status(201).json(savedGate);
        } catch (error) {
            logger.error('Error creating gate:', error);
            return res.status(500).json({ message: 'Error creating gate' });
        }
    }

    static async updateGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, type, location, status, gate_number, description, is_active } = req.body;
            
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            // Update properties if provided
            if (name !== undefined) gate.name = name;
            if (gate_number !== undefined) gate.gate_number = gate_number;
            if (type !== undefined) gate.type = type;
            if (location !== undefined) gate.location = location;
            if (status !== undefined) gate.status = status;
            if (description !== undefined) gate.description = description;
            if (is_active !== undefined) gate.is_active = is_active;
            
            const updatedGate = await gateRepository.save(gate);
            
            return res.status(200).json(updatedGate);
        } catch (error) {
            logger.error(`Error updating gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error updating gate' });
        }
    }

    static async deleteGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            await gateRepository.remove(gate);
            
            return res.status(200).json({ message: 'Gate deleted successfully' });
        } catch (error) {
            logger.error(`Error deleting gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error deleting gate' });
        }
    }
} 