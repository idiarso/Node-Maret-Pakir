import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import logger from './utils/logger';
import { Device } from './entities/Device';
import { DeviceHealthCheck } from './entities/DeviceHealthCheck';
import { DeviceLog } from './entities/DeviceLog';
import { User } from './entities/User';
import { Vehicle } from './entities/Vehicle';
import { ParkingArea } from './entities/ParkingArea';
import { ParkingSession } from './entities/ParkingSession';
import { Ticket } from './entities/Ticket';
import { Gate } from './entities/Gate';
import { Membership } from './entities/Membership';
import { PaymentTransaction } from './entities/PaymentTransaction';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'parking_system',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [
    Device,
    DeviceHealthCheck,
    DeviceLog,
    User,
    Vehicle,
    ParkingArea,
    ParkingSession,
    Ticket,
    Gate,
    Membership,
    PaymentTransaction
  ],
  migrations: [path.join(__dirname, 'migrations/**/*.{ts,js}')],
  subscribers: [path.join(__dirname, 'subscribers/**/*.{ts,js}')]
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