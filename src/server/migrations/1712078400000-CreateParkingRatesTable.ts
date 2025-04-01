import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateParkingRatesTable1712078400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing table and enum type
        await queryRunner.query(`DROP TABLE IF EXISTS "parking_rates" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_type" CASCADE`);

        // Create the enum type
        await queryRunner.query(`
            CREATE TYPE "vehicle_type" AS ENUM (
                'MOTOR',
                'MOBIL',
                'TRUK',
                'BUS',
                'VAN'
            )
        `);

        // Create the table
        await queryRunner.query(`
            CREATE TABLE "parking_rates" (
                "id" SERIAL PRIMARY KEY,
                "vehicle_type" vehicle_type NOT NULL,
                "base_rate" decimal(10,2) NOT NULL,
                "hourly_rate" decimal(10,2) DEFAULT 0,
                "daily_rate" decimal(10,2),
                "weekly_rate" decimal(10,2),
                "monthly_rate" decimal(10,2),
                "grace_period" integer DEFAULT 15,
                "is_weekend_rate" boolean DEFAULT false,
                "is_holiday_rate" boolean DEFAULT false,
                "effective_from" timestamp NOT NULL DEFAULT now(),
                "effective_to" timestamp,
                "created_at" timestamp with time zone DEFAULT now(),
                "updated_at" timestamp with time zone DEFAULT now()
            )
        `);

        // Insert default parking rates
        await queryRunner.query(`
            INSERT INTO parking_rates (vehicle_type, base_rate, hourly_rate, daily_rate)
            VALUES 
                ('MOTOR', 2500.00, 1000.00, 10000.00),
                ('MOBIL', 5000.00, 2000.00, 20000.00),
                ('TRUK', 10000.00, 5000.00, 50000.00),
                ('BUS', 10000.00, 5000.00, 50000.00),
                ('VAN', 7000.00, 3000.00, 35000.00)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "parking_rates" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_type" CASCADE`);
    }
} 