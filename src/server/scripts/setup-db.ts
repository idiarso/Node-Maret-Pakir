import { config } from 'dotenv';
import AppDataSource from '../config/ormconfig';
import { Logger } from '../../shared/services/Logger';

config();

const logger = Logger.getInstance();

async function setupDatabase() {
    try {
        // Initialize database connection
        await AppDataSource.initialize();
        logger.info('Database connection established');

        // Run migrations
        await AppDataSource.runMigrations();
        logger.info('Migrations completed');

        // Run seeds
        const { InitialData1709913600000 } = await import('../seeds/1709913600000-InitialData');
        const seed = new InitialData1709913600000();
        await seed.up(AppDataSource.createQueryRunner());
        logger.info('Seeds completed');

        logger.info('Database setup completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase(); 