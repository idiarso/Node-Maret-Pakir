import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIpAddressToDevices1680538102000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First drop the column if it exists
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                BEGIN
                    ALTER TABLE devices DROP COLUMN IF EXISTS "ipAddress";
                EXCEPTION
                    WHEN undefined_column THEN
                        NULL;
                END;
            END $$;
        `);

        // Then add it back as nullable
        await queryRunner.query(`
            ALTER TABLE devices ADD COLUMN "ipAddress" character varying(50)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE devices DROP COLUMN IF EXISTS "ipAddress"
        `);
    }
} 