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
            logger.info(`Found ${gates.length} gates`);
            
            return res.status(200).json(gates);
        } catch (error) {
            logger.error('Error fetching gates:', error);
            return res.status(500).json({ message: 'Error fetching gates', error: String(error) });
        }
    }

    static async getGateById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Fetching gate with id: ${id}`);
            
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                logger.warn(`Gate with id ${id} not found`);
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            return res.status(200).json(gate);
        } catch (error) {
            logger.error(`Error fetching gate with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error fetching gate', error: String(error) });
        }
    }

    static async createGate(req: Request, res: Response) {
        try {
            logger.info('Creating gate with data:', req.body);
            
            // Dapatkan data dari request body
            let { name, type, location, status, gate_number, description, is_active } = req.body;
            
            // Validasi dasar
            if (!name) {
                logger.warn('Gate name is required');
                return res.status(400).json({ message: 'Gate name is required' });
            }
            
            const gateRepository = AppDataSource.getRepository(Gate);
            
            // Set default values jika tidak ada
            if (!gate_number) gate_number = name.substring(0, 20); // Truncate jika terlalu panjang
            if (!type) type = GateType.ENTRY;
            if (!status) status = GateStatus.INACTIVE;
            if (is_active === undefined) is_active = true;
            
            // Buat objek gate baru
            const newGate = {
                name,
                gate_number,
                type,
                location,
                status,
                description,
                is_active,
                hardware_config: {},
                maintenance_schedule: {},
                error_log: {}
            };
            
            logger.info('Gate object to be created:', newGate);
            
            // Simpan gate baru
            try {
                const savedGate = await gateRepository.save(newGate);
                logger.info('Gate saved successfully with ID:', savedGate.id);
                return res.status(201).json(savedGate);
            } catch (saveError) {
                logger.error('Error saving gate to database:', saveError);
                logger.debug('Gate data that failed to save:', JSON.stringify(newGate));
                return res.status(500).json({ 
                    message: 'Error saving gate to database', 
                    error: String(saveError),
                    data: newGate 
                });
            }
            
        } catch (error) {
            logger.error('Unexpected error creating gate:', error);
            return res.status(500).json({ 
                message: 'Unexpected error creating gate', 
                error: String(error),
                requestBody: req.body 
            });
        }
    }

    static async updateGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Updating gate with id: ${id}`, req.body);
            
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                logger.warn(`Gate with id ${id} not found for update`);
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            // Update properties if provided
            const updateData = req.body;
            
            // Create updated gate object with safe defaults
            const updatedGate = {
                ...gate,
                ...updateData,
                hardware_config: updateData.hardware_config || gate.hardware_config || {},
                maintenance_schedule: updateData.maintenance_schedule || gate.maintenance_schedule || {},
                error_log: updateData.error_log || gate.error_log || {}
            };
            
            logger.info('Gate object to be updated:', updatedGate);
            
            try {
                const savedGate = await gateRepository.save(updatedGate);
                logger.info('Gate updated successfully:', savedGate.id);
                return res.status(200).json(savedGate);
            } catch (saveError) {
                logger.error('Error updating gate in database:', saveError);
                return res.status(500).json({ 
                    message: 'Error updating gate in database', 
                    error: String(saveError),
                    data: updatedGate 
                });
            }
            
        } catch (error) {
            logger.error(`Error updating gate with id ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Error updating gate', 
                error: String(error),
                requestBody: req.body 
            });
        }
    }

    static async deleteGate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Deleting gate with id: ${id}`);
            
            const gateRepository = AppDataSource.getRepository(Gate);
            const gate = await gateRepository.findOne({ where: { id: Number(id) } });
            
            if (!gate) {
                logger.warn(`Gate with id ${id} not found for deletion`);
                return res.status(404).json({ message: 'Gate not found' });
            }
            
            try {
                await gateRepository.remove(gate);
                logger.info(`Gate with id ${id} deleted successfully`);
                return res.status(200).json({ 
                    message: 'Gate deleted successfully',
                    deletedGate: {
                        id: Number(id),
                        name: gate.name
                    }
                });
            } catch (deleteError) {
                logger.error(`Error during database deletion of gate ${id}:`, deleteError);
                return res.status(500).json({ 
                    message: 'Error deleting gate from database', 
                    error: String(deleteError)
                });
            }
            
        } catch (error) {
            logger.error(`Unexpected error deleting gate with id ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Unexpected error deleting gate', 
                error: String(error)
            });
        }
    }
} 