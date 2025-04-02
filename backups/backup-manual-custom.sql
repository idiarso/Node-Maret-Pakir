-- SQL Backup generated at 2025-04-02T07:33:46.827Z
-- This SQL backup can be restored using: psql -d your_database -f backup_file.sql

BEGIN;

-- Table: migrations
CREATE TABLE IF NOT EXISTS "migrations" (
  "id" integer NOT NULL,
  "timestamp" bigint NOT NULL,
  "name" character varying NOT NULL
);

ALTER TABLE "migrations" ADD PRIMARY KEY ("id");

-- Sample data for migrations
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (1, '1709913600000', 'InitialSchema1709913600000');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (2, '1709913600001', 'AdditionalTables1709913600001');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (29, '1712078400000', 'CreateParkingRatesTable1712078400000');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (30, '1712078400001', 'AddLocationToParkingArea1712078400001');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (31, '1743529518394', 'InitialMigration1743529518394');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (32, '1743529518395', 'UpdateUsernames1743529518395');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (33, '1743529518396', 'SetDefaultPasswords1743529518396');
INSERT INTO "migrations" ("id", "timestamp", "name") VALUES (34, '1743545100000', 'CreateShiftSummaries1743545100000');

-- Table: shift_summaries
CREATE TABLE IF NOT EXISTS "shift_summaries" (
  "id" integer NOT NULL,
  "operator_id" integer ,
  "shift_start" timestamp with time zone NOT NULL,
  "shift_end" timestamp with time zone ,
  "total_transactions" integer ,
  "total_amount" numeric ,
  "cash_amount" numeric ,
  "non_cash_amount" numeric ,
  "created_at" timestamp with time zone ,
  "updated_at" timestamp with time zone 
);

ALTER TABLE "shift_summaries" ADD PRIMARY KEY ("id");

-- Sample data for shift_summaries
INSERT INTO "shift_summaries" ("id", "operator_id", "shift_start", "shift_end", "total_transactions", "total_amount", "cash_amount", "non_cash_amount", "created_at", "updated_at") VALUES (3, 1, '2025-04-02T06:36:22.762Z', NULL, 0, '0.00', '0.00', '0.00', '2025-04-02T06:36:22.765Z', '2025-04-02T06:36:22.765Z');

-- Table: operator_shifts
CREATE TABLE IF NOT EXISTS "operator_shifts" (
  "id" integer NOT NULL,
  "operator_id" integer ,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone ,
  "gate_id" integer ,
  "status" character varying ,
  "created_at" timestamp with time zone ,
  "updated_at" timestamp with time zone 
);

ALTER TABLE "operator_shifts" ADD PRIMARY KEY ("id");

-- Table: parking_areas
CREATE TABLE IF NOT EXISTS "parking_areas" (
  "id" integer NOT NULL,
  "name" character varying NOT NULL,
  "capacity" integer NOT NULL,
  "occupied" integer NOT NULL,
  "status" character varying NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "location" character varying NOT NULL
);

ALTER TABLE "parking_areas" ADD PRIMARY KEY ("id");

-- Sample data for parking_areas
INSERT INTO "parking_areas" ("id", "name", "capacity", "occupied", "status", "created_at", "updated_at", "location") VALUES (3, 'Main Parking', 100, 0, 'active', '2025-04-01T19:39:05.391Z', '2025-04-01T19:39:05.391Z', 'Building A');
INSERT INTO "parking_areas" ("id", "name", "capacity", "occupied", "status", "created_at", "updated_at", "location") VALUES (5, 'Area 1', 1000, 0, 'active', '2025-04-02T03:23:13.945Z', '2025-04-02T03:23:13.945Z', 'Area 1');
INSERT INTO "parking_areas" ("id", "name", "capacity", "occupied", "status", "created_at", "updated_at", "location") VALUES (6, 'Area 2', 500, 0, 'active', '2025-04-02T03:27:57.606Z', '2025-04-02T03:27:57.606Z', 'Area 2');

-- Table: notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" integer NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "title" character varying NOT NULL,
  "message" text NOT NULL,
  "status" USER-DEFINED NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL
);

ALTER TABLE "notifications" ADD PRIMARY KEY ("id");

-- Table: parking_statistics
CREATE TABLE IF NOT EXISTS "parking_statistics" (
  "id" integer NOT NULL,
  "date" date NOT NULL,
  "total_vehicles" integer NOT NULL,
  "total_revenue" numeric NOT NULL,
  "average_duration" integer ,
  "peak_hours" jsonb ,
  "vehicle_types" jsonb ,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL
);

ALTER TABLE "parking_statistics" ADD PRIMARY KEY ("id");

-- Table: holidays
CREATE TABLE IF NOT EXISTS "holidays" (
  "id" integer NOT NULL,
  "date" date NOT NULL,
  "name" character varying NOT NULL,
  "description" text ,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL
);

ALTER TABLE "holidays" ADD PRIMARY KEY ("id");

-- Table: user_activity_logs
CREATE TABLE IF NOT EXISTS "user_activity_logs" (
  "id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "action" character varying NOT NULL,
  "details" jsonb ,
  "ip_address" character varying ,
  "created_at" timestamp without time zone NOT NULL
);

ALTER TABLE "user_activity_logs" ADD PRIMARY KEY ("id");

-- Table: backup_logs
CREATE TABLE IF NOT EXISTS "backup_logs" (
  "id" integer NOT NULL,
  "type" character varying NOT NULL,
  "status" character varying NOT NULL,
  "file_path" character varying ,
  "size" bigint ,
  "created_at" timestamp without time zone NOT NULL
);

ALTER TABLE "backup_logs" ADD PRIMARY KEY ("id");

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "token" character varying NOT NULL,
  "ip_address" character varying ,
  "user_agent" text ,
  "last_activity" timestamp without time zone NOT NULL,
  "created_at" timestamp without time zone NOT NULL
);

ALTER TABLE "user_sessions" ADD PRIMARY KEY ("id");

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
  "id" integer NOT NULL,
  "username" character varying NOT NULL,
  "email" character varying NOT NULL,
  "password_hash" character varying NOT NULL,
  "full_name" character varying NOT NULL,
  "role" USER-DEFINED NOT NULL,
  "active" boolean NOT NULL,
  "last_login" timestamp without time zone ,
  "created_at" timestamp without time zone ,
  "updated_at" timestamp without time zone 
);

ALTER TABLE "users" ADD PRIMARY KEY ("id");

-- Sample data for users
INSERT INTO "users" ("id", "username", "email", "password_hash", "full_name", "role", "active", "last_login", "created_at", "updated_at") VALUES (1, 'admin', 'admin@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'System Administrator', 'ADMIN', true, NULL, '2025-04-02T07:33:26.772Z', '2025-04-02T07:33:26.772Z');

-- Table: parking_fees
CREATE TABLE IF NOT EXISTS "parking_fees" (
  "id" integer NOT NULL,
  "ticket_id" integer ,
  "base_rate" numeric NOT NULL,
  "duration" integer NOT NULL,
  "hourly_charges" numeric NOT NULL,
  "additional_charges" numeric ,
  "total_amount" numeric NOT NULL,
  "calculated_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone ,
  "updated_at" timestamp with time zone 
);

ALTER TABLE "parking_fees" ADD PRIMARY KEY ("id");

-- Table: vehicle_types
CREATE TABLE IF NOT EXISTS "vehicle_types" (
  "id" integer NOT NULL,
  "description" text ,
  "price" numeric NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "isActive" boolean NOT NULL,
  "name" character varying NOT NULL
);

ALTER TABLE "vehicle_types" ADD PRIMARY KEY ("id");

-- Table: memberships
CREATE TABLE IF NOT EXISTS "memberships" (
  "id" integer NOT NULL,
  "vehicleId" integer ,
  "start_date" timestamp without time zone NOT NULL,
  "end_date" timestamp without time zone ,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "type" character varying NOT NULL,
  "status" character varying NOT NULL
);

ALTER TABLE "memberships" ADD PRIMARY KEY ("id");

-- Table: vehicles
CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" integer NOT NULL,
  "registration_date" timestamp without time zone ,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "plate_number" character varying NOT NULL,
  "type" character varying NOT NULL,
  "owner_name" character varying ,
  "owner_contact" character varying 
);

ALTER TABLE "vehicles" ADD PRIMARY KEY ("id");

-- Table: parking_sessions
CREATE TABLE IF NOT EXISTS "parking_sessions" (
  "id" integer NOT NULL,
  "entry_time" timestamp without time zone NOT NULL,
  "exit_time" timestamp without time zone ,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "ticketId" integer ,
  "vehicleId" integer ,
  "parkingAreaId" integer ,
  "status" character varying NOT NULL
);

ALTER TABLE "parking_sessions" ADD PRIMARY KEY ("id");

-- Table: tickets
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" integer NOT NULL,
  "vehicle_type_id" integer NOT NULL,
  "entry_time" timestamp without time zone NOT NULL,
  "exit_time" timestamp without time zone ,
  "status" USER-DEFINED NOT NULL,
  "created_by" integer NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "ticketNumber" character varying NOT NULL,
  "plateNumber" character varying NOT NULL
);

ALTER TABLE "tickets" ADD PRIMARY KEY ("id");

-- Table: payments
CREATE TABLE IF NOT EXISTS "payments" (
  "id" integer NOT NULL,
  "ticket_id" integer NOT NULL,
  "amount" numeric NOT NULL,
  "status" USER-DEFINED NOT NULL,
  "paid_by" integer NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "paymentMethod" USER-DEFINED ,
  "transactionId" character varying 
);

ALTER TABLE "payments" ADD PRIMARY KEY ("id");

-- Table: system_logs
CREATE TABLE IF NOT EXISTS "system_logs" (
  "id" integer NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "message" text NOT NULL,
  "user_id" integer ,
  "created_at" timestamp without time zone NOT NULL
);

ALTER TABLE "system_logs" ADD PRIMARY KEY ("id");

-- Table: device_logs
CREATE TABLE IF NOT EXISTS "device_logs" (
  "id" integer NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "deviceId" integer ,
  "message" character varying NOT NULL
);

ALTER TABLE "device_logs" ADD PRIMARY KEY ("id");

-- Table: device_health_checks
CREATE TABLE IF NOT EXISTS "device_health_checks" (
  "id" integer NOT NULL,
  "status" USER-DEFINED NOT NULL,
  "checked_at" timestamp without time zone NOT NULL,
  "deviceId" integer ,
  "error_message" character varying 
);

ALTER TABLE "device_health_checks" ADD PRIMARY KEY ("id");

-- Table: devices
CREATE TABLE IF NOT EXISTS "devices" (
  "id" integer NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "status" USER-DEFINED NOT NULL,
  "last_maintenance" timestamp without time zone ,
  "next_maintenance" timestamp without time zone ,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "name" character varying NOT NULL,
  "location" character varying 
);

ALTER TABLE "devices" ADD PRIMARY KEY ("id");

-- Table: gate_logs
CREATE TABLE IF NOT EXISTS "gate_logs" (
  "id" integer NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "gateId" integer ,
  "operatorId" integer ,
  "action" character varying NOT NULL,
  "status" character varying NOT NULL
);

ALTER TABLE "gate_logs" ADD PRIMARY KEY ("id");

-- Table: gates
CREATE TABLE IF NOT EXISTS "gates" (
  "id" integer NOT NULL,
  "status" USER-DEFINED NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "gate_number" character varying NOT NULL,
  "location" character varying ,
  "description" text ,
  "hardware_config" jsonb ,
  "maintenance_schedule" jsonb ,
  "error_log" jsonb ,
  "is_active" boolean NOT NULL,
  "name" character varying NOT NULL,
  "type" USER-DEFINED NOT NULL
);

ALTER TABLE "gates" ADD PRIMARY KEY ("id");

-- Sample data for gates
INSERT INTO "gates" ("id", "status", "created_at", "updated_at", "gate_number", "location", "description", "hardware_config", "maintenance_schedule", "error_log", "is_active", "name", "type") VALUES (3, 'ACTIVE', '2025-04-02T06:02:54.697Z', '2025-04-02T06:02:54.697Z', '1', '1', NULL, [object Object], [object Object], [object Object], true, '1', 'ENTRY');

-- Table: system_settings
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" integer NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL,
  "key" character varying NOT NULL,
  "value" character varying NOT NULL,
  "description" character varying 
);

ALTER TABLE "system_settings" ADD PRIMARY KEY ("id");

-- Table: parking_rates
CREATE TABLE IF NOT EXISTS "parking_rates" (
  "id" integer NOT NULL,
  "vehicle_type" USER-DEFINED NOT NULL,
  "base_rate" numeric NOT NULL,
  "hourly_rate" numeric ,
  "daily_rate" numeric ,
  "weekly_rate" numeric ,
  "monthly_rate" numeric ,
  "grace_period" integer ,
  "is_weekend_rate" boolean NOT NULL,
  "is_holiday_rate" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "effective_from" timestamp without time zone NOT NULL,
  "effective_to" timestamp without time zone 
);

ALTER TABLE "parking_rates" ADD PRIMARY KEY ("id");

-- Sample data for parking_rates
INSERT INTO "parking_rates" ("id", "vehicle_type", "base_rate", "hourly_rate", "daily_rate", "weekly_rate", "monthly_rate", "grace_period", "is_weekend_rate", "is_holiday_rate", "created_at", "updated_at", "effective_from", "effective_to") VALUES (1, 'MOTORCYCLE', '2500.00', '1000.00', '10000.00', NULL, NULL, 15, false, false, '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', NULL);
INSERT INTO "parking_rates" ("id", "vehicle_type", "base_rate", "hourly_rate", "daily_rate", "weekly_rate", "monthly_rate", "grace_period", "is_weekend_rate", "is_holiday_rate", "created_at", "updated_at", "effective_from", "effective_to") VALUES (2, 'CAR', '5000.00', '2000.00', '20000.00', NULL, NULL, 15, false, false, '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', NULL);
INSERT INTO "parking_rates" ("id", "vehicle_type", "base_rate", "hourly_rate", "daily_rate", "weekly_rate", "monthly_rate", "grace_period", "is_weekend_rate", "is_holiday_rate", "created_at", "updated_at", "effective_from", "effective_to") VALUES (3, 'TRUCK', '10000.00', '5000.00', '50000.00', NULL, NULL, 15, false, false, '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', NULL);
INSERT INTO "parking_rates" ("id", "vehicle_type", "base_rate", "hourly_rate", "daily_rate", "weekly_rate", "monthly_rate", "grace_period", "is_weekend_rate", "is_holiday_rate", "created_at", "updated_at", "effective_from", "effective_to") VALUES (4, 'BUS', '10000.00', '5000.00', '50000.00', NULL, NULL, 15, false, false, '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', NULL);
INSERT INTO "parking_rates" ("id", "vehicle_type", "base_rate", "hourly_rate", "daily_rate", "weekly_rate", "monthly_rate", "grace_period", "is_weekend_rate", "is_holiday_rate", "created_at", "updated_at", "effective_from", "effective_to") VALUES (5, 'VAN', '7000.00', '3000.00', '35000.00', NULL, NULL, 15, false, false, '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', '2025-04-01T18:38:21.158Z', NULL);

-- Table: payment_transaction
CREATE TABLE IF NOT EXISTS "payment_transaction" (
  "id" integer NOT NULL,
  "amount" numeric NOT NULL,
  "paymentMethod" USER-DEFINED NOT NULL,
  "paymentStatus" USER-DEFINED NOT NULL,
  "receiptNumber" character varying NOT NULL,
  "notes" character varying ,
  "transactionTime" timestamp without time zone NOT NULL,
  "operatorId" integer ,
  "vehicleId" integer 
);

ALTER TABLE "payment_transaction" ADD PRIMARY KEY ("id");

-- Table: parking_area
CREATE TABLE IF NOT EXISTS "parking_area" (
  "id" integer NOT NULL,
  "name" character varying NOT NULL,
  "capacity" integer NOT NULL,
  "occupied" integer NOT NULL,
  "status" character varying NOT NULL,
  "created_at" timestamp without time zone NOT NULL,
  "updated_at" timestamp without time zone NOT NULL
);

ALTER TABLE "parking_area" ADD PRIMARY KEY ("id");

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" integer NOT NULL,
  "action" USER-DEFINED NOT NULL,
  "entityType" USER-DEFINED NOT NULL,
  "entityId" character varying ,
  "oldData" jsonb ,
  "newData" jsonb ,
  "description" character varying NOT NULL,
  "ipAddress" character varying ,
  "userAgent" character varying ,
  "user_id" integer ,
  "created_at" timestamp without time zone NOT NULL
);

ALTER TABLE "audit_logs" ADD PRIMARY KEY ("id");

COMMIT;
