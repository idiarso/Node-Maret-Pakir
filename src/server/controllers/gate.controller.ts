import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { Gate } from '../entities/Gate';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export class GateController {
    private gateRepository = AppDataSource.getRepository(Gate);

    /**
     * Get all gates
     * @route GET /api/gates
     */
    async getAllGates(req: Request, res: Response) {
        try {
            console.log('GET /api/gates: Fetching all gates');
            const gates = await this.gateRepository.find();
            console.log(`GET /api/gates: Found ${gates.length} gates`);
            return res.json(gates);
        } catch (error) {
            console.error('GET /api/gates error:', error);
            return res.status(500).json({ message: 'Error fetching gates', error });
        }
    }

    /**
     * Get gate by ID
     * @route GET /api/gates/:id
     */
    async getGateById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const gate = await this.gateRepository.findOne({ where: { id } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            return res.json(gate);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching gate', error });
        }
    }

    /**
     * Create a new gate
     * @route POST /api/gates
     */
    async createGate(req: Request, res: Response) {
        try {
            const { name, gate_number, location, type, description } = req.body;
            
            if (!name || !gate_number || !type) {
                return res.status(400).json({ message: 'Name, gate_number and type are required' });
            }
            
            const newGate = this.gateRepository.create({
                name,
                gate_number,
                location,
                type,
                description,
                status: 'ACTIVE'
            });
            
            const result = await this.gateRepository.save(newGate);
            return res.status(201).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating gate', error });
        }
    }

    /**
     * Update a gate
     * @route PUT /api/gates/:id
     */
    async updateGate(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { name, gate_number, location, type, description } = req.body;
            
            const gate = await this.gateRepository.findOne({ where: { id } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            gate.name = name || gate.name;
            gate.gate_number = gate_number || gate.gate_number;
            gate.location = location || gate.location;
            gate.type = type || gate.type;
            gate.description = description || gate.description;
            
            const result = await this.gateRepository.save(gate);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating gate', error });
        }
    }

    /**
     * Delete a gate
     * @route DELETE /api/gates/:id
     */
    async deleteGate(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const gate = await this.gateRepository.findOne({ where: { id } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            await this.gateRepository.remove(gate);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting gate', error });
        }
    }

    /**
     * Change gate status
     * @route PUT /api/gates/:id/status
     */
    async changeGateStatus(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { status } = req.body;
            
            if (!status) {
                return res.status(400).json({ message: 'Status is required' });
            }
            
            const gate = await this.gateRepository.findOne({ where: { id } });
            
            if (!gate) {
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            gate.status = status;
            const result = await this.gateRepository.save(gate);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Error changing gate status', error });
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
            
            if (gate.status !== 'ACTIVE') {
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
            
            if (gate.status !== 'ACTIVE') {
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