import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsernames1743529518395 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update users without usernames, setting username to the part of email before @
        await queryRunner.query(`
            UPDATE users 
            SET username = SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)
            WHERE username IS NULL OR username = '';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No need for down migration as we don't want to remove usernames
    }
} 