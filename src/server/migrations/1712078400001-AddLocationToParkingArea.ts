import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToParkingArea1712078400001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add location column with a default value
        await queryRunner.query(`
            ALTER TABLE "parking_areas"
            ADD COLUMN IF NOT EXISTS "location" varchar NOT NULL DEFAULT 'Main Area'
        `);

        // Remove the default constraint after adding the column
        await queryRunner.query(`
            ALTER TABLE "parking_areas"
            ALTER COLUMN "location" DROP DEFAULT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "parking_areas"
            DROP COLUMN IF EXISTS "location"
        `);
    }
} 