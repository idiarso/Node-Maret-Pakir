import AppDataSource, { initializeDatabase } from '../config/ormconfig';
import { Vehicle } from '../entities/Vehicle';
import { Logger } from '../../shared/services/Logger';
import { Between } from 'typeorm';

const logger = Logger.getInstance();

export async function generateTicketNumber(): Promise<string> {
    try {
        // Get initialized data source
        const dataSource = await initializeDatabase();
        const vehicleRepository = dataSource.getRepository(Vehicle);
        
        // Get the current date in YYYYMMDD format
        const today = new Date();
        const dateStr = today.getFullYear().toString() +
                       (today.getMonth() + 1).toString().padStart(2, '0') +
                       today.getDate().toString().padStart(2, '0');
        
        // Get the count of vehicles entered today
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        
        const count = await vehicleRepository.count({
            where: {
                entry_time: Between(startOfDay, endOfDay)
            }
        });
        
        // Generate ticket number: YYYYMMDD-XXXX where XXXX is the sequential number
        const sequentialNumber = (count + 1).toString().padStart(4, '0');
        return `${dateStr}-${sequentialNumber}`;
    } catch (error) {
        logger.error('Error generating ticket number:', error);
        throw error;
    }
} 