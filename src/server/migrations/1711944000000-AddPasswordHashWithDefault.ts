import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class AddPasswordHashWithDefault1711944000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First add the column as nullable
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "passwordHash" character varying`);
        
        // Generate default password hash
        const defaultPassword = "admin";
        const saltRounds = 10;
        const defaultHash = await bcrypt.hash(defaultPassword, saltRounds);
        
        // Update existing users with default password hash
        await queryRunner.query(`UPDATE "users" SET "passwordHash" = $1 WHERE "passwordHash" IS NULL`, [defaultHash]);
        
        // Make the column not nullable
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordHash"`);
    }
} 