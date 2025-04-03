import { MigrationInterface, QueryRunner } from "typeorm";

export class FixVehicleTypeEnum1712078400001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing enum and create new one
        await queryRunner.query(`
            ALTER TABLE parking_rates ALTER COLUMN vehicle_type TYPE VARCHAR;
            DROP TYPE IF EXISTS parking_rates_vehicle_type_enum CASCADE;
            CREATE TYPE parking_rates_vehicle_type_enum AS ENUM ('MOTOR', 'MOBIL', 'TRUK', 'BUS', 'VAN');
            ALTER TABLE parking_rates ALTER COLUMN vehicle_type TYPE parking_rates_vehicle_type_enum USING vehicle_type::parking_rates_vehicle_type_enum;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to original enum
        await queryRunner.query(`
            ALTER TABLE parking_rates ALTER COLUMN vehicle_type TYPE VARCHAR;
            DROP TYPE IF EXISTS parking_rates_vehicle_type_enum CASCADE;
            CREATE TYPE parking_rates_vehicle_type_enum AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS');
            ALTER TABLE parking_rates ALTER COLUMN vehicle_type TYPE parking_rates_vehicle_type_enum USING 
            CASE 
                WHEN vehicle_type = 'MOTOR' THEN 'MOTORCYCLE'
                WHEN vehicle_type = 'MOBIL' THEN 'CAR'
                WHEN vehicle_type = 'TRUK' THEN 'TRUCK'
                ELSE vehicle_type
            END::parking_rates_vehicle_type_enum;
        `);
    }
} 