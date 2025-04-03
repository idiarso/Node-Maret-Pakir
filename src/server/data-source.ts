import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import logger from './utils/logger';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parking_system',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, 'entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, 'subscribers/**/*.{ts,js}')],
});

// Initialize database function
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection initialized successfully');
    }
    return AppDataSource;
  } catch (error) {
    logger.error('Error during database initialization:', error);
    throw error;
  }
};

export default AppDataSource; 