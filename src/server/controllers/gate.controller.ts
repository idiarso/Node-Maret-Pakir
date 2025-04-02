import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { Gate, GateType, GateStatus } from '../entities/Gate';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export class GateController {
    
    static async getAllGates(req: Request, res: Response) {
        try {
            const gateRepository = AppDataSource.getRepository(Gate);
            const gates = await gateRepository.find({
                order: {
                    id: 'ASC'
                }
            });
            
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
            const { name, type, location, description } = req.body;
            
            if (!name || !type) {
                return res.status(400).json({ message: 'Name and type are required' });
            }
            
            const gateRepository = AppDataSource.getRepository(Gate);
            
            const newGate = gateRepository.create({
                name,
                type,
                location,
                description,
                status: GateStatus.INACTIVE,
                is_active: true
            });
            
            const savedGate = await gateRepository.save(newGate);
            return res.status(201).json(savedGate);
        } catch (error) {
            logger.error('Error creating gate:', error);
            return res.status(500).json({ message: 'Error creating gate' });
        }
    }

    static async updateGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            const updatedGate = {
                ...gate,
                ...updateData
            };
            
            const savedGate = await gateRepository.save(updatedGate);
            return res.status(200).json(savedGate);
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

    static async changeGateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !Object.values(GateStatus).includes(status)) {
                return res.status(400).json({ message: 'Invalid gate status' });
            }
            
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            gate.status = status;
            const savedGate = await gateRepository.save(gate);
            
            return res.status(200).json(savedGate);
        } catch (error) {
            logger.error(`Error changing status for gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error changing gate status' });
        }
    }

    static async openGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            if (gate.status !== GateStatus.ACTIVE) {
                return res.status(400).json({ message: 'Gate is not active' });
            }
            
            // Here you would typically integrate with your hardware control system
            // For now, we'll just simulate the gate opening
            logger.info(`Opening gate ${id}`);
            
            return res.status(200).json({ 
                message: 'Gate opened successfully',
                gate_id: id,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error(`Error opening gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error opening gate' });
        }
    }

    static async closeGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            if (gate.status !== GateStatus.ACTIVE) {
                return res.status(400).json({ message: 'Gate is not active' });
            }
            
            // Here you would typically integrate with your hardware control system
            // For now, we'll just simulate the gate closing
            logger.info(`Closing gate ${id}`);
            
            return res.status(200).json({ 
                message: 'Gate closed successfully',
                gate_id: id,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error(`Error closing gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error closing gate' });
        }
    }
} 