import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { Shift, ShiftStatus } from '../entities/Shift';
import { User } from '../entities/User';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export class ShiftController {
    
    static async getAllShifts(req: Request, res: Response) {
        try {
            const shiftRepository = AppDataSource.getRepository(Shift);
            const userRepository = AppDataSource.getRepository(User);
            
            const shifts = await shiftRepository.find({
                order: {
                    id: 'ASC'
                }
            });
            
            // Get operator names for each shift
            const shiftsWithOperatorNames = await Promise.all(shifts.map(async (shift) => {
                const operator = await userRepository.findOne({ where: { id: shift.operator_id } });
                return {
                    ...shift,
                    operatorName: operator ? operator.fullName : `Operator ${shift.operator_id}`
                };
            }));
            
            logger.info(`Found ${shifts.length} shifts`);
            return res.status(200).json({
                data: shiftsWithOperatorNames,
                total: shifts.length,
                page: 1,
                limit: 50
            });
        } catch (error) {
            logger.error('Error fetching shifts:', error);
            return res.status(500).json({ message: 'Error fetching shifts', error: String(error) });
        }
    }

    static async getShiftById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Fetching shift with id: ${id}`);
            
            const shiftRepository = AppDataSource.getRepository(Shift);
            const userRepository = AppDataSource.getRepository(User);
            const shift = await shiftRepository.findOne({ where: { id: Number(id) } });
            
            if (!shift) {
                logger.warn(`Shift with id ${id} not found`);
                return res.status(404).json({ message: 'Shift not found' });
            }

            // Get operator name
            const operator = await userRepository.findOne({ where: { id: shift.operator_id } });
            const shiftWithOperatorName = {
                ...shift,
                operatorName: operator ? operator.fullName : `Operator ${shift.operator_id}`
            };
            
            return res.status(200).json(shiftWithOperatorName);
        } catch (error) {
            logger.error(`Error fetching shift with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error fetching shift', error: String(error) });
        }
    }

    static async createShift(req: Request, res: Response) {
        try {
            logger.info('Creating shift with data:', req.body);
            
            // Get data from request body
            const { operator_id } = req.body;
            
            // Basic validation
            if (!operator_id) {
                logger.warn('Operator ID is required');
                return res.status(400).json({ message: 'Operator ID is required' });
            }
            
            const shiftRepository = AppDataSource.getRepository(Shift);
            const userRepository = AppDataSource.getRepository(User);
            
            // Create new shift object
            const newShift = shiftRepository.create({
                operator_id,
                shift_start: new Date(),
                total_transactions: 0,
                total_amount: 0,
                cash_amount: 0,
                non_cash_amount: 0
            });
            
            logger.info('Shift object to be created:', newShift);
            
            // Save new shift
            try {
                const savedShift = await shiftRepository.save(newShift);
                
                // Get operator name
                const operator = await userRepository.findOne({ where: { id: savedShift.operator_id } });
                const shiftWithOperatorName = {
                    ...savedShift,
                    operatorName: operator ? operator.fullName : `Operator ${savedShift.operator_id}`
                };
                
                logger.info('Shift saved successfully with ID:', savedShift.id);
                return res.status(201).json(shiftWithOperatorName);
            } catch (saveError) {
                logger.error('Error saving shift to database:', saveError);
                return res.status(500).json({ 
                    message: 'Error saving shift to database', 
                    error: String(saveError)
                });
            }
            
        } catch (error) {
            logger.error('Unexpected error creating shift:', error);
            return res.status(500).json({ 
                message: 'Unexpected error creating shift', 
                error: String(error)
            });
        }
    }

    static async completeShift(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Completing shift with id: ${id}`);
            
            const shiftRepository = AppDataSource.getRepository(Shift);
            const userRepository = AppDataSource.getRepository(User);
            const shift = await shiftRepository.findOne({ where: { id: Number(id) } });
            
            if (!shift) {
                logger.warn(`Shift with id ${id} not found for completion`);
                return res.status(404).json({ message: 'Shift not found' });
            }
            
            // Update shift end time
            shift.shift_end = new Date();
            
            logger.info('Completing shift:', shift);
            
            try {
                const savedShift = await shiftRepository.save(shift);
                
                // Get operator name
                const operator = await userRepository.findOne({ where: { id: savedShift.operator_id } });
                const shiftWithOperatorName = {
                    ...savedShift,
                    operatorName: operator ? operator.fullName : `Operator ${savedShift.operator_id}`
                };
                
                logger.info(`Shift ${id} completed successfully`);
                return res.status(200).json(shiftWithOperatorName);
            } catch (saveError) {
                logger.error(`Error completing shift ${id}:`, saveError);
                return res.status(500).json({ 
                    message: 'Error completing shift', 
                    error: String(saveError)
                });
            }
            
        } catch (error) {
            logger.error(`Error completing shift with id ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Error completing shift', 
                error: String(error)
            });
        }
    }

    static async updateShift(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Updating shift with id: ${id}`, req.body);
            
            const shiftRepository = AppDataSource.getRepository(Shift);
            const userRepository = AppDataSource.getRepository(User);
            const shift = await shiftRepository.findOne({ where: { id: Number(id) } });
            
            if (!shift) {
                logger.warn(`Shift with id ${id} not found for update`);
                return res.status(404).json({ message: 'Shift not found' });
            }
            
            // Update properties if provided
            const updateData = req.body;
            
            const updatedShift = {
                ...shift,
                ...updateData
            };
            
            logger.info('Shift object to be updated:', updatedShift);
            
            try {
                const savedShift = await shiftRepository.save(updatedShift);
                
                // Get operator name
                const operator = await userRepository.findOne({ where: { id: savedShift.operator_id } });
                const shiftWithOperatorName = {
                    ...savedShift,
                    operatorName: operator ? operator.fullName : `Operator ${savedShift.operator_id}`
                };
                
                logger.info(`Shift ${id} updated successfully`);
                return res.status(200).json(shiftWithOperatorName);
            } catch (saveError) {
                logger.error(`Error updating shift ${id}:`, saveError);
                return res.status(500).json({ 
                    message: 'Error updating shift', 
                    error: String(saveError)
                });
            }
            
        } catch (error) {
            logger.error(`Error updating shift with id ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Error updating shift', 
                error: String(error)
            });
        }
    }

    static async deleteShift(req: Request, res: Response) {
        try {
            const { id } = req.params;
            logger.info(`Deleting shift with id: ${id}`);
            
            const shiftRepository = AppDataSource.getRepository(Shift);
            const shift = await shiftRepository.findOne({ where: { id: Number(id) } });
            
            if (!shift) {
                logger.warn(`Shift with id ${id} not found for deletion`);
                return res.status(404).json({ message: 'Shift not found' });
            }
            
            try {
                await shiftRepository.remove(shift);
                logger.info(`Shift with id ${id} deleted successfully`);
                return res.status(200).json({ 
                    message: 'Shift deleted successfully',
                    deletedShift: {
                        id: Number(id)
                    }
                });
            } catch (deleteError) {
                logger.error(`Error during database deletion of shift ${id}:`, deleteError);
                return res.status(500).json({ 
                    message: 'Error deleting shift from database', 
                    error: String(deleteError)
                });
            }
            
        } catch (error) {
            logger.error(`Unexpected error deleting shift with id ${req.params.id}:`, error);
            return res.status(500).json({ 
                message: 'Unexpected error deleting shift', 
                error: String(error)
            });
        }
    }
} 