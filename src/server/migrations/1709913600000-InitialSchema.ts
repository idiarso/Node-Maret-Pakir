import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1709913600000 implements MigrationInterface {
    name = 'InitialSchema1709913600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`
            CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR');
            CREATE TYPE ticket_status AS ENUM ('ACTIVE', 'PAID', 'CANCELLED');
            CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                role user_role NOT NULL DEFAULT 'OPERATOR',
                active BOOLEAN NOT NULL DEFAULT true,
                last_login TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create vehicle_types table
        await queryRunner.query(`
            CREATE TABLE vehicle_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tickets table
        await queryRunner.query(`
            CREATE TABLE tickets (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(255) UNIQUE NOT NULL,
                vehicle_type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
                plate_number VARCHAR(255),
                entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                exit_time TIMESTAMP,
                status ticket_status NOT NULL DEFAULT 'ACTIVE',
                created_by INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create payments table
        await queryRunner.query(`
            CREATE TABLE payments (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL REFERENCES tickets(id),
                amount DECIMAL(10,2) NOT NULL,
                status payment_status NOT NULL DEFAULT 'PENDING',
                payment_method VARCHAR(255),
                transaction_id VARCHAR(255),
                paid_by INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS payments`);
        await queryRunner.query(`DROP TABLE IF EXISTS tickets`);
        await queryRunner.query(`DROP TABLE IF EXISTS vehicle_types`);
        await queryRunner.query(`DROP TABLE IF EXISTS users`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS payment_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS ticket_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    }
} 