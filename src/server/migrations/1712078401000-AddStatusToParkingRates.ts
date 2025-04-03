import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToParkingRates1712078401000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "parking_rates"
            ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'active'
        `);

        // Update existing records to have 'active' status
        await queryRunner.query(`
            UPDATE "parking_rates"
            SET "status" = 'active'
            WHERE "status" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "parking_rates"
            DROP COLUMN "status"
        `);
    }
} 