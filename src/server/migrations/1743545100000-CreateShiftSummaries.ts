import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateShiftSummaries1743545100000 implements MigrationInterface {
    name = 'CreateShiftSummaries1743545100000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists first
        const tableExists = await queryRunner.hasTable('shift_summaries');
        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE "shift_summaries" (
                    "id" SERIAL PRIMARY KEY,
                    "operator_id" INTEGER NOT NULL,
                    "shift_start" TIMESTAMP WITH TIME ZONE NOT NULL,
                    "shift_end" TIMESTAMP WITH TIME ZONE,
                    "total_transactions" INTEGER NOT NULL DEFAULT 0,
                    "total_amount" NUMERIC(10,2) NOT NULL DEFAULT 0,
                    "cash_amount" NUMERIC(10,2) NOT NULL DEFAULT 0,
                    "non_cash_amount" NUMERIC(10,2) NOT NULL DEFAULT 0,
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                )
            `);
            
            // Create index on operator_id
            await queryRunner.query(`
                CREATE INDEX "idx_shift_summaries_operator_id" ON "shift_summaries" ("operator_id")
            `);
            
            // Create index on shift_start
            await queryRunner.query(`
                CREATE INDEX "idx_shift_summaries_shift_start" ON "shift_summaries" ("shift_start")
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_shift_summaries_shift_start"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_shift_summaries_operator_id"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS "shift_summaries"`);
    }
} 