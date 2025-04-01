import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1743529518394 implements MigrationInterface {
    name = 'InitialMigration1743529518394'

    private async dropIndexIfExists(queryRunner: QueryRunner, indexName: string): Promise<void> {
        const indexExists = await queryRunner.query(
            `SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE indexname = $1
            )`,
            [indexName]
        );

        if (indexExists[0].exists) {
            await queryRunner.query(`DROP INDEX "public"."${indexName}"`);
        }
    }

    private async dropConstraintIfExists(queryRunner: QueryRunner, tableName: string, constraintName: string): Promise<void> {
        const constraintExists = await queryRunner.query(
            `SELECT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = $1
            )`,
            [constraintName]
        );

        if (constraintExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT "${constraintName}"`);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop all indexes if they exist
        const indexes = [
            'idx_users_email',
            'idx_users_role',
            'idx_vehicles_plate_number',
            'idx_vehicles_type',
            'idx_parking_sessions_ticket_id',
            'idx_parking_sessions_vehicle_id',
            'idx_parking_sessions_parking_area_id',
            'idx_parking_sessions_entry_time',
            'idx_parking_sessions_exit_time',
            'idx_parking_sessions_status',
            'idx_parking_sessions_combined',
            'idx_tickets_plate_number',
            'idx_tickets_status',
            'idx_payments_status',
            'idx_device_logs_device_id',
            'idx_devices_type',
            'idx_devices_status',
            'idx_gate_logs_gate_id',
            'idx_gates_status',
            'idx_system_settings_key',
            'idx_parking_rates_vehicle_type',
            'idx_parking_rates_effective_from',
            'IDX_546fe2b47641539f266782fc00',
            'IDX_9f191717f8cdb334c162b65fb3',
            'IDX_5a7ae1d239e07ad693abf73c18',
            'IDX_d345fdd6d7ea1d52374cccf161'
        ];

        for (const index of indexes) {
            await this.dropIndexIfExists(queryRunner, index);
        }

        // Drop all constraints if they exist
        await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT IF EXISTS "memberships_vehicle_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP CONSTRAINT IF EXISTS "parking_sessions_ticket_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP CONSTRAINT IF EXISTS "parking_sessions_vehicle_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP CONSTRAINT IF EXISTS "parking_sessions_parking_area_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_vehicle_type_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_created_by_fkey"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_ticket_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_paid_by_fkey"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" DROP CONSTRAINT IF EXISTS "device_health_checks_device_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "device_logs" DROP CONSTRAINT IF EXISTS "device_logs_device_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP CONSTRAINT IF EXISTS "gate_logs_gate_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP CONSTRAINT IF EXISTS "gate_logs_operator_id_fkey"`);
        await this.dropConstraintIfExists(queryRunner, "parking_rates", "check_valid_rates");

        await queryRunner.query(`ALTER TABLE "memberships" RENAME COLUMN "vehicle_id" TO "vehicleId"`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transaction_paymentmethod_enum" AS ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT', 'CARD', 'EWALLET')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transaction_paymentstatus_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "payment_transaction" ("id" SERIAL NOT NULL, "amount" numeric(10,2) NOT NULL, "paymentMethod" "public"."payment_transaction_paymentmethod_enum" NOT NULL, "paymentStatus" "public"."payment_transaction_paymentstatus_enum" NOT NULL DEFAULT 'PENDING', "receiptNumber" character varying NOT NULL, "notes" character varying, "transactionTime" TIMESTAMP NOT NULL DEFAULT now(), "operatorId" integer, "vehicleId" integer, CONSTRAINT "UQ_9a76899da05871c556d344b33d6" UNIQUE ("receiptNumber"), CONSTRAINT "REL_e7f24e09ce7bd0920d3e9b1168" UNIQUE ("vehicleId"), CONSTRAINT "PK_82c3470854cf4642dfb0d7150cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "parking_area" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "capacity" integer NOT NULL, "occupied" integer NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_864127a5917f9114dd620336439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('USER_LOGIN', 'USER_LOGOUT', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'TICKET_CREATE', 'TICKET_UPDATE', 'TICKET_DELETE', 'PAYMENT_CREATE', 'PAYMENT_UPDATE', 'PAYMENT_COMPLETE', 'PAYMENT_FAIL', 'GATE_OPEN', 'GATE_CLOSE', 'SYSTEM_ERROR', 'SYSTEM_CONFIG_UPDATE')`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_entitytype_enum" AS ENUM('USER', 'TICKET', 'PAYMENT', 'GATE', 'SYSTEM')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL, "entityType" "public"."audit_logs_entitytype_enum" NOT NULL, "entityId" character varying, "oldData" jsonb, "newData" jsonb, "description" character varying NOT NULL, "ipAddress" character varying, "userAgent" character varying, "user_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "ticket_id"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "parking_area_id"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "tickets_ticket_number_key"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "ticket_number"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "plate_number"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "transaction_id"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" DROP COLUMN "device_id"`);
        await queryRunner.query(`ALTER TABLE "device_logs" DROP COLUMN "device_id"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "gate_id"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "operator_id"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "last_maintenance"`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "ticketId" integer`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "vehicleId" integer`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "parkingAreaId" integer`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "ticketNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "UQ_e99bd0f51b92896fdaf99ebb715" UNIQUE ("ticketNumber")`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "plateNumber" character varying NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT', 'CARD', 'EWALLET')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "paymentMethod" "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "transactionId" character varying`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ADD "deviceId" integer`);
        await queryRunner.query(`ALTER TABLE "device_logs" ADD "deviceId" integer`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "gateId" integer`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "operatorId" integer`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "gate_number" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gates" ADD CONSTRAINT "UQ_b5b07c4d511091c29a650c864a9" UNIQUE ("gate_number")`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "location" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "hardware_config" jsonb`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "maintenance_schedule" jsonb`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "error_log" jsonb`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_username_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying`);
        await queryRunner.query(`UPDATE "users" SET "username" = COALESCE(email, 'user_' || id) WHERE "username" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying`);
        await queryRunner.query(`UPDATE "users" SET "password_hash" = '$2b$10$6RpJW.VeJQ0QgHAVBDGNKu7qHKa.na/P0ZyYzSCYaoZGWNXgQK9Hy' WHERE "password_hash" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying`);
        await queryRunner.query(`UPDATE "users" SET "full_name" = COALESCE(username, email) WHERE "full_name" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying`);
        await queryRunner.query(`UPDATE "users" SET "email" = username || '@example.com' WHERE "email" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TYPE "public"."user_role" RENAME TO "user_role_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'OPERATOR')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD "status" character varying NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "memberships" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "memberships" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "memberships" ALTER COLUMN "vehicleId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_plate_number_key"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "plate_number"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "plate_number" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "UQ_a7eeeb4b551b2629dd9ee964134" UNIQUE ("plate_number")`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "owner_name"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "owner_name" character varying`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "owner_contact"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "owner_contact" character varying`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "status" character varying NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."ticket_status" RENAME TO "ticket_status_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tickets_status_enum" AS ENUM('ACTIVE', 'PAID', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "public"."tickets_status_enum" USING "status"::"text"::"public"."tickets_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."ticket_status_old"`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "entry_time" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."payment_status" RENAME TO "payment_status_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum" USING "status"::"text"::"public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."payment_status_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" DROP COLUMN "error_message"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ADD "error_message" character varying`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ALTER COLUMN "checked_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."log_type" RENAME TO "log_type_old"`);
        await queryRunner.query(`CREATE TYPE "public"."device_logs_type_enum" AS ENUM('INFO', 'WARNING', 'ERROR', 'DEBUG')`);
        await queryRunner.query(`ALTER TABLE "device_logs" ALTER COLUMN "type" TYPE "public"."device_logs_type_enum" USING "type"::"text"::"public"."device_logs_type_enum"`);
        await queryRunner.query(`ALTER TABLE "system_logs" ALTER COLUMN "type" TYPE "public"."device_logs_type_enum" USING "type"::"text"::"public"."device_logs_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."log_type_old"`);
        await queryRunner.query(`ALTER TABLE "device_logs" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "device_logs" ADD "message" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_logs" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."device_type" RENAME TO "device_type_old"`);
        await queryRunner.query(`CREATE TYPE "public"."devices_type_enum" AS ENUM('CAMERA', 'PRINTER', 'SCANNER', 'GATE')`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "type" TYPE "public"."devices_type_enum" USING "type"::"text"::"public"."devices_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."device_type_old"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "location" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."device_status" RENAME TO "device_status_old"`);
        await queryRunner.query(`CREATE TYPE "public"."devices_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR')`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ALTER COLUMN "status" TYPE "public"."devices_status_enum" USING "status"::"text"::"public"."devices_status_enum"`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "status" TYPE "public"."devices_status_enum" USING "status"::"text"::"public"."devices_status_enum"`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."device_status_old"`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "action" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "status" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "name" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gates" ADD CONSTRAINT "UQ_a1f92809075c1fb17921fb20683" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."gates_type_enum" AS ENUM('ENTRY', 'EXIT')`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "type" "public"."gates_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."gate_status" RENAME TO "gate_status_old"`);
        await queryRunner.query(`CREATE TYPE "public"."gates_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR')`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "status" TYPE "public"."gates_status_enum" USING "status"::"text"::"public"."gates_status_enum"`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "status" SET DEFAULT 'INACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."gate_status_old"`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_key_key"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "key"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "key" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key")`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "value" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."vehicle_type" RENAME TO "vehicle_type_old"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ADD COLUMN "vehicle_type_temp" varchar`);

        await queryRunner.query(`UPDATE "parking_rates" SET "vehicle_type_temp" = CASE 
            WHEN "vehicle_type" = 'MOTOR' THEN 'MOTORCYCLE'
            WHEN "vehicle_type" = 'MOBIL' THEN 'CAR'
            WHEN "vehicle_type" = 'TRUK' THEN 'TRUCK'
            ELSE "vehicle_type"::text
        END`);

        await queryRunner.query(`CREATE TYPE "public"."parking_rates_vehicle_type_enum" AS ENUM('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS')`);

        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "vehicle_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "vehicle_type" TYPE "public"."parking_rates_vehicle_type_enum" USING vehicle_type_temp::"public"."parking_rates_vehicle_type_enum"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" DROP COLUMN "vehicle_type_temp"`);
        await queryRunner.query(`DROP TYPE "public"."vehicle_type_old"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "hourly_rate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "hourly_rate" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "is_weekend_rate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "is_holiday_rate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" DROP COLUMN "effective_from"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ADD "effective_from" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "parking_rates" DROP COLUMN "effective_to"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ADD "effective_to" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_d345fdd6d7ea1d52374cccf161" ON "gates" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a7ae1d239e07ad693abf73c18" ON "gates" ("gate_number", "type") `);
        await queryRunner.query(`CREATE INDEX "IDX_9f191717f8cdb334c162b65fb3" ON "parking_rates" ("is_weekend_rate", "is_holiday_rate") `);
        await queryRunner.query(`CREATE INDEX "IDX_546fe2b47641539f266782fc00" ON "parking_rates" ("vehicle_type", "effective_from", "effective_to") `);
        await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "FK_b1533b373afc3238f54903df847" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_bc5bf6ef31167e563b7b1b6b351" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transaction" ADD CONSTRAINT "FK_e7f24e09ce7bd0920d3e9b11681" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD CONSTRAINT "FK_287e2090f8e6306608fea5a7bdf" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD CONSTRAINT "FK_f8c8940a71eb7a7110e04ae267d" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD CONSTRAINT "FK_6f0aed13f09230d16e6bc343e77" FOREIGN KEY ("parkingAreaId") REFERENCES "parking_area"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_43a39b8ef0282f68da4eee9b7e7" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_8798a589dc4c71b6d0e8c2b9fc3" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_aac3e9d7b82ecaeb355f2f4e0d1" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8093099077cd2059724ddf6022d" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ADD CONSTRAINT "FK_4505b308336ac9dbaca0fca8750" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_logs" ADD CONSTRAINT "FK_d2a6bc2c616bbc656e6734e03a4" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD CONSTRAINT "FK_ebb3eaf37f5de99d9934b094c0f" FOREIGN KEY ("gateId") REFERENCES "gates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD CONSTRAINT "FK_8c57e7bb3052eea42e0410d899a" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP CONSTRAINT "FK_8c57e7bb3052eea42e0410d899a"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP CONSTRAINT "FK_ebb3eaf37f5de99d9934b094c0f"`);
        await queryRunner.query(`ALTER TABLE "device_logs" DROP CONSTRAINT "FK_d2a6bc2c616bbc656e6734e03a4"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" DROP CONSTRAINT "FK_4505b308336ac9dbaca0fca8750"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8093099077cd2059724ddf6022d"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_aac3e9d7b82ecaeb355f2f4e0d1"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_8798a589dc4c71b6d0e8c2b9fc3"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_43a39b8ef0282f68da4eee9b7e7"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP CONSTRAINT "FK_6f0aed13f09230d16e6bc343e77"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP CONSTRAINT "FK_f8c8940a71eb7a7110e04ae267d"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP CONSTRAINT "FK_287e2090f8e6306608fea5a7bdf"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction" DROP CONSTRAINT "FK_e7f24e09ce7bd0920d3e9b11681"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction" DROP CONSTRAINT "FK_bc5bf6ef31167e563b7b1b6b351"`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP CONSTRAINT "FK_b1533b373afc3238f54903df847"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_546fe2b47641539f266782fc00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f191717f8cdb334c162b65fb3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a7ae1d239e07ad693abf73c18"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d345fdd6d7ea1d52374cccf161"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" DROP COLUMN "effective_to"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ADD "effective_to" date`);
        await queryRunner.query(`ALTER TABLE "parking_rates" DROP COLUMN "effective_from"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ADD "effective_from" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "is_holiday_rate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "is_weekend_rate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "hourly_rate" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "hourly_rate" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."vehicle_type_old" AS ENUM('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN')`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ALTER COLUMN "vehicle_type" TYPE "public"."vehicle_type_old" USING "vehicle_type"::"text"::"public"."vehicle_type_old"`);
        await queryRunner.query(`DROP TYPE "public"."parking_rates_vehicle_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicle_type_old" RENAME TO "vehicle_type"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "system_settings" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "value" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d"`);
        await queryRunner.query(`ALTER TABLE "system_settings" DROP COLUMN "key"`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD "key" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key")`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."gate_status_old" AS ENUM('OPEN', 'CLOSED', 'ERROR')`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "status" TYPE "public"."gate_status_old" USING "status"::"text"::"public"."gate_status_old"`);
        await queryRunner.query(`ALTER TABLE "gates" ALTER COLUMN "status" SET DEFAULT 'CLOSED'`);
        await queryRunner.query(`DROP TYPE "public"."gates_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."gate_status_old" RENAME TO "gate_status"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."gates_type_enum"`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gates" DROP CONSTRAINT "UQ_a1f92809075c1fb17921fb20683"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "status" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "action" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."device_status_old" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR')`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "status" TYPE "public"."device_status_old" USING "status"::"text"::"public"."device_status_old"`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."devices_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."device_status_old" RENAME TO "device_status"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "location" character varying(255)`);
        await queryRunner.query(`CREATE TYPE "public"."device_type_old" AS ENUM('CAMERA', 'PRINTER', 'SCANNER', 'GATE')`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "type" TYPE "public"."device_type_old" USING "type"::"text"::"public"."device_type_old"`);
        await queryRunner.query(`DROP TYPE "public"."devices_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."device_type_old" RENAME TO "device_type"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "device_logs" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "device_logs" ADD "message" text NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."log_type_old" AS ENUM('INFO', 'WARNING', 'ERROR', 'DEBUG')`);
        await queryRunner.query(`ALTER TABLE "device_logs" ALTER COLUMN "type" TYPE "public"."log_type_old" USING "type"::"text"::"public"."log_type_old"`);
        await queryRunner.query(`DROP TYPE "public"."device_logs_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."log_type_old" RENAME TO "log_type"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ALTER COLUMN "checked_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" DROP COLUMN "error_message"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ADD "error_message" text`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."payment_status_old" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payment_status_old" USING "status"::"text"::"public"."payment_status_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payment_status_old" RENAME TO "payment_status"`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "entry_time" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."ticket_status_old" AS ENUM('ACTIVE', 'PAID', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "public"."ticket_status_old" USING "status"::"text"::"public"."ticket_status_old"`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."tickets_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ticket_status_old" RENAME TO "ticket_status"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "status" character varying(50) NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "owner_contact"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "owner_contact" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "owner_name"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "owner_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "UQ_a7eeeb4b551b2629dd9ee964134"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "plate_number"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "plate_number" character varying(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_plate_number_key" UNIQUE ("plate_number")`);
        await queryRunner.query(`ALTER TABLE "memberships" ALTER COLUMN "vehicleId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "memberships" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "memberships" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD "status" character varying(50) NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "memberships" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD "type" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_old" AS ENUM('ADMIN', 'OPERATOR')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying`);
        await queryRunner.query(`UPDATE "users" SET "full_name" = COALESCE(username, email) WHERE "full_name" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying`);
        await queryRunner.query(`UPDATE "users" SET "password_hash" = '$2b$10$6RpJW.VeJQ0QgHAVBDGNKu7qHKa.na/P0ZyYzSCYaoZGWNXgQK9Hy' WHERE "password_hash" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "error_log"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "maintenance_schedule"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "hardware_config"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP CONSTRAINT "UQ_b5b07c4d511091c29a650c864a9"`);
        await queryRunner.query(`ALTER TABLE "gates" DROP COLUMN "gate_number"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "operatorId"`);
        await queryRunner.query(`ALTER TABLE "gate_logs" DROP COLUMN "gateId"`);
        await queryRunner.query(`ALTER TABLE "device_logs" DROP COLUMN "deviceId"`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" DROP COLUMN "deviceId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "transactionId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentMethod"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "plateNumber"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "UQ_e99bd0f51b92896fdaf99ebb715"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "ticketNumber"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "parkingAreaId"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" DROP COLUMN "ticketId"`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "gates" ADD "last_maintenance" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "operator_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD "gate_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_logs" ADD "device_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ADD "device_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "transaction_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "payment_method" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "plate_number" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "ticket_number" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_number_key" UNIQUE ("ticket_number")`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "parking_area_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "vehicle_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD "ticket_id" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_entitytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "parking_area"`);
        await queryRunner.query(`DROP TABLE "payment_transaction"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transaction_paymentstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transaction_paymentmethod_enum"`);
        await queryRunner.query(`ALTER TABLE "memberships" RENAME COLUMN "vehicleId" TO "vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "parking_rates" ADD CONSTRAINT "check_valid_rates" CHECK (((hourly_rate > (0)::numeric) AND (base_rate >= (0)::numeric)))`);
        await queryRunner.query(`CREATE INDEX "idx_parking_rates_effective_from" ON "parking_rates" ("effective_from") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_rates_vehicle_type" ON "parking_rates" ("vehicle_type") `);
        await queryRunner.query(`CREATE INDEX "idx_system_settings_key" ON "system_settings" ("key") `);
        await queryRunner.query(`CREATE INDEX "idx_gates_status" ON "gates" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_gate_logs_gate_id" ON "gate_logs" ("gate_id") `);
        await queryRunner.query(`CREATE INDEX "idx_devices_status" ON "devices" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_devices_type" ON "devices" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_device_logs_device_id" ON "device_logs" ("device_id") `);
        await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_tickets_status" ON "tickets" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_tickets_plate_number" ON "tickets" ("plate_number") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_combined" ON "parking_sessions" ("entry_time", "status", "vehicle_id") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_status" ON "parking_sessions" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_exit_time" ON "parking_sessions" ("exit_time") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_entry_time" ON "parking_sessions" ("entry_time") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_parking_area_id" ON "parking_sessions" ("parking_area_id") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_vehicle_id" ON "parking_sessions" ("vehicle_id") `);
        await queryRunner.query(`CREATE INDEX "idx_parking_sessions_ticket_id" ON "parking_sessions" ("ticket_id") `);
        await queryRunner.query(`CREATE INDEX "idx_vehicles_type" ON "vehicles" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_vehicles_plate_number" ON "vehicles" ("plate_number") `);
        await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD CONSTRAINT "gate_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gate_logs" ADD CONSTRAINT "gate_logs_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "gates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_logs" ADD CONSTRAINT "device_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_health_checks" ADD CONSTRAINT "device_health_checks_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "payments_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "payments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "tickets_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_parking_area_id_fkey" FOREIGN KEY ("parking_area_id") REFERENCES "parking_areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "memberships" ADD CONSTRAINT "memberships_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
