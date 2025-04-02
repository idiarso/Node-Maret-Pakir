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

const logger = Logger.getInstance();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    synchronize: false,
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
    migrations: ['src/server/migrations/**/*.ts'],
    subscribers: ['src/server/subscribers/**/*.ts'],
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

        // Create enum types if they don't exist
        await AppDataSource.query(`
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            
            DO $$ BEGIN
                CREATE TYPE vehicle_type AS ENUM ('MOTOR', 'MOBIL', 'TRUK', 'BUS', 'VAN');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            -- Drop existing tables to clean up schema
            DROP TABLE IF EXISTS users CASCADE;
        `);

        // Create tables if they don't exist (safer than synchronize)
        await AppDataSource.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role user_role NOT NULL DEFAULT 'OPERATOR',
                active BOOLEAN NOT NULL DEFAULT true,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS parking_areas (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                capacity INTEGER NOT NULL CHECK (capacity >= 0),
                occupied INTEGER NOT NULL DEFAULT 0 CHECK (occupied >= 0),
                status VARCHAR(50) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT check_valid_occupancy CHECK (occupied <= capacity)
            );

            -- Insert default admin user if it doesn't exist
            INSERT INTO users (username, email, password_hash, full_name, role, active)
            VALUES (
                'admin',
                'admin@parking-system.com',
                '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', -- This is the hash for 'admin'
                'System Administrator',
                'ADMIN',
                true
            )
            ON CONFLICT (username) DO NOTHING;
        `);

        logger.info('Database schema initialized');
        return AppDataSource;
    } catch (error) {
        logger.error('Error during database initialization:', error);
        throw error;
    }
}

export default AppDataSource; 