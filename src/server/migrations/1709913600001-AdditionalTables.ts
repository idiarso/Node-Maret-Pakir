import { MigrationInterface, QueryRunner } from "typeorm";

export class AdditionalTables1709913600001 implements MigrationInterface {
    name = 'AdditionalTables1709913600001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create additional enum types
        await queryRunner.query(`
            CREATE TYPE device_type AS ENUM ('CAMERA', 'PRINTER', 'SCANNER', 'GATE');
            CREATE TYPE device_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR');
            CREATE TYPE gate_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR', 'OPEN', 'CLOSED');
            CREATE TYPE notification_type AS ENUM ('SYSTEM', 'SECURITY', 'MAINTENANCE', 'PAYMENT');
            CREATE TYPE notification_status AS ENUM ('UNREAD', 'READ', 'ARCHIVED');
            CREATE TYPE log_type AS ENUM ('INFO', 'WARNING', 'ERROR', 'DEBUG');
        `);

        // Create parking_areas table
        await queryRunner.query(`
            CREATE TABLE parking_areas (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                capacity INTEGER NOT NULL,
                occupied INTEGER NOT NULL DEFAULT 0,
                status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create vehicles table
        await queryRunner.query(`
            CREATE TABLE vehicles (
                id SERIAL PRIMARY KEY,
                plate_number VARCHAR(20) UNIQUE NOT NULL,
                type VARCHAR(50) NOT NULL,
                owner_name VARCHAR(255),
                owner_contact VARCHAR(255),
                registration_date TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create memberships table
        await queryRunner.query(`
            CREATE TABLE memberships (
                id SERIAL PRIMARY KEY,
                vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
                type VARCHAR(50) NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP,
                status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create parking_sessions table
        await queryRunner.query(`
            CREATE TABLE parking_sessions (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL REFERENCES tickets(id),
                vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
                parking_area_id INTEGER NOT NULL REFERENCES parking_areas(id),
                entry_time TIMESTAMP NOT NULL,
                exit_time TIMESTAMP,
                status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create devices table
        await queryRunner.query(`
            CREATE TABLE devices (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type device_type NOT NULL,
                location VARCHAR(255),
                status device_status NOT NULL DEFAULT 'ACTIVE',
                last_maintenance TIMESTAMP,
                next_maintenance TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create device_health_checks table
        await queryRunner.query(`
            CREATE TABLE device_health_checks (
                id SERIAL PRIMARY KEY,
                device_id INTEGER NOT NULL REFERENCES devices(id),
                status device_status NOT NULL,
                error_message TEXT,
                checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create gates table
        await queryRunner.query(`
            CREATE TABLE gates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                status gate_status NOT NULL DEFAULT 'CLOSED',
                last_maintenance TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create gate_logs table
        await queryRunner.query(`
            CREATE TABLE gate_logs (
                id SERIAL PRIMARY KEY,
                gate_id INTEGER NOT NULL REFERENCES gates(id),
                action VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                operator_id INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create device_logs table
        await queryRunner.query(`
            CREATE TABLE device_logs (
                id SERIAL PRIMARY KEY,
                device_id INTEGER NOT NULL REFERENCES devices(id),
                type log_type NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create system_logs table
        await queryRunner.query(`
            CREATE TABLE system_logs (
                id SERIAL PRIMARY KEY,
                type log_type NOT NULL,
                message TEXT NOT NULL,
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                type notification_type NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status notification_status NOT NULL DEFAULT 'UNREAD',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create system_settings table
        await queryRunner.query(`
            CREATE TABLE system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create parking_statistics table
        await queryRunner.query(`
            CREATE TABLE parking_statistics (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                total_vehicles INTEGER NOT NULL DEFAULT 0,
                total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
                average_duration INTEGER,
                peak_hours JSONB,
                vehicle_types JSONB,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create holidays table
        await queryRunner.query(`
            CREATE TABLE holidays (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create user_activity_logs table
        await queryRunner.query(`
            CREATE TABLE user_activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                action VARCHAR(255) NOT NULL,
                details JSONB,
                ip_address VARCHAR(45),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create backup_logs table
        await queryRunner.query(`
            CREATE TABLE backup_logs (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                file_path VARCHAR(255),
                size BIGINT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create user_sessions table
        await queryRunner.query(`
            CREATE TABLE user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX idx_parking_sessions_ticket_id ON parking_sessions(ticket_id);
            CREATE INDEX idx_parking_sessions_vehicle_id ON parking_sessions(vehicle_id);
            CREATE INDEX idx_parking_sessions_parking_area_id ON parking_sessions(parking_area_id);
            CREATE INDEX idx_device_logs_device_id ON device_logs(device_id);
            CREATE INDEX idx_gate_logs_gate_id ON gate_logs(gate_id);
            CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
            CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
            CREATE INDEX idx_user_sessions_token ON user_sessions(token);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_sessions_ticket_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_sessions_vehicle_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_sessions_parking_area_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_device_logs_device_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_gate_logs_gate_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_activity_logs_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_sessions_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_sessions_token`);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`);
        await queryRunner.query(`DROP TABLE IF EXISTS backup_logs`);
        await queryRunner.query(`DROP TABLE IF EXISTS user_activity_logs`);
        await queryRunner.query(`DROP TABLE IF EXISTS holidays`);
        await queryRunner.query(`DROP TABLE IF EXISTS parking_statistics`);
        await queryRunner.query(`DROP TABLE IF EXISTS system_settings`);
        await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
        await queryRunner.query(`DROP TABLE IF EXISTS system_logs`);
        await queryRunner.query(`DROP TABLE IF EXISTS device_logs`);
        await queryRunner.query(`DROP TABLE IF EXISTS gate_logs`);
        await queryRunner.query(`DROP TABLE IF EXISTS gates`);
        await queryRunner.query(`DROP TABLE IF EXISTS device_health_checks`);
        await queryRunner.query(`DROP TABLE IF EXISTS devices`);
        await queryRunner.query(`DROP TABLE IF EXISTS parking_sessions`);
        await queryRunner.query(`DROP TABLE IF EXISTS memberships`);
        await queryRunner.query(`DROP TABLE IF EXISTS vehicles`);
        await queryRunner.query(`DROP TABLE IF EXISTS parking_areas`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS log_type`);
        await queryRunner.query(`DROP TYPE IF EXISTS notification_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS notification_type`);
        await queryRunner.query(`DROP TYPE IF EXISTS gate_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS device_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS device_type`);
    }
} 