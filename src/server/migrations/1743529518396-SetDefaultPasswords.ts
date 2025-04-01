import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class SetDefaultPasswords1743529518396 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Set a default hashed password for all users that don't have one
        const defaultPassword = await bcrypt.hash('ChangeMe123!', 10);
        await queryRunner.query(`
            UPDATE users 
            SET password_hash = $1
            WHERE password_hash IS NULL OR password_hash = '';
        `, [defaultPassword]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No down migration needed as we don't want to remove passwords
    }
} 