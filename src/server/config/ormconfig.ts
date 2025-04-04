import { DataSource } from 'typeorm';
import { config } from './config';
import { User } from "../entities/User";
import { Ticket } from "../entities/Ticket";
import { Payment } from "../entities/Payment";
import { VehicleType } from "../entities/VehicleType";
import { Device } from "../entities/Device";
import { DeviceHealthCheck } from "../entities/DeviceHealthCheck";
import { DeviceLog } from "../entities/DeviceLog";
import { Gate } from "../entities/Gate";
import { GateLog } from "../entities/GateLog";
import { ParkingArea } from "../entities/ParkingArea";
import { ParkingSession } from "../entities/ParkingSession";
import { Vehicle } from "../entities/Vehicle";
import { Membership } from "../entities/Membership";
import { SystemSetting } from "../entities/SystemSetting";
import { AuditLog } from "../entities/AuditLog";
import { PaymentTransaction } from "../entities/PaymentTransaction";
import { ParkingRate } from "../entities/ParkingRate";
import { Shift } from "../entities/Shift";
import { Client as pgClient } from 'pg';
import { Logger } from '../../shared/services/Logger';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../shared/types';
import path from 'path';

const logger = Logger.getInstance();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    synchronize: true, // Enable synchronize for development
    logging: config.isDevelopment,
    entities: [
        User,
        Ticket,
        Payment,
        VehicleType,
        Device,
        DeviceHealthCheck,
        DeviceLog,
        Gate,
        GateLog,
        ParkingArea,
        ParkingSession,
        Vehicle,
        Membership,
        SystemSetting,
        AuditLog,
        PaymentTransaction,
        ParkingRate,
        Shift
    ],
    migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
    subscribers: [path.join(__dirname, '../subscribers/**/*.{ts,js}')],
    migrationsRun: false,
});

// Initialize database and connection
export async function initializeDatabase() {
    try {
        // If already initialized, return early
        if (AppDataSource.isInitialized) {
            return AppDataSource;
        }

        // First connect to postgres database using pg directly
        const client = new pgClient({
            host: config.database.host || "localhost",
            port: config.database.port || 5432,
            user: config.database.username || "postgres",
            password: config.database.password || "postgres",
            database: "postgres"
        });

        await client.connect();
        logger.info('Connected to postgres database');

        // Check if our database exists
        const result = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [config.database.name || "parking_system1"]
        );

        // Create database if it doesn't exist
        if (result.rows.length === 0) {
            await client.query(`CREATE DATABASE ${config.database.name || "parking_system1"}`);
            logger.info('Database created successfully');
        }

        // Close postgres connection
        await client.end();

        // Initialize TypeORM connection
        await AppDataSource.initialize();
        logger.info('Connected to application database');

        // Create default admin user if it doesn't exist
        const userRepository = AppDataSource.getRepository(User);
        const adminUser = await userRepository.findOne({ where: { username: 'admin' } });

        if (!adminUser) {
            logger.info('Creating default admin user...');
            const user = new User({});
            user.username = 'admin';
            user.email = 'admin@parking-system.com';
            user.fullName = 'System Administrator';
            user.role = UserRole.ADMIN;
            user.active = true;
            // Hash the password 'admin'
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash('admin', salt);
            
            await userRepository.save(user);
            logger.info('Default admin user created successfully');
        }

        return AppDataSource;
    } catch (error) {
        logger.error('Error during database initialization:', error);
        throw error;
    }
}

export default AppDataSource; 