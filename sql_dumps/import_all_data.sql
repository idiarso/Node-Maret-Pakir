-- Import all SQL data files for parking system
-- Run this file to import all dummy data

-- First, import parking_area data to fix foreign key constraint
\i 'sql_dumps/12_parking_area.sql'

-- Now import the rest of the data in sequence
\i 'sql_dumps/01_users.sql'
\i 'sql_dumps/02_devices.sql'
\i 'sql_dumps/03_vehicle_types.sql'
\i 'sql_dumps/04_vehicles.sql'
\i 'sql_dumps/05_memberships.sql'
\i 'sql_dumps/06_operator_shifts.sql'
\i 'sql_dumps/07_tickets.sql'
\i 'sql_dumps/08_parking_sessions.sql'
\i 'sql_dumps/09_payments.sql'
\i 'sql_dumps/10_shift_summaries.sql'
\i 'sql_dumps/11_logs.sql'
\i 'sql_dumps/13_statistics.sql'
\i 'sql_dumps/14_additional_data.sql'

-- Reset sequences based on the current maximum ID values
SELECT setval('public.users_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.users), false);
SELECT setval('public.devices_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.devices), false);
SELECT setval('public.vehicle_types_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.vehicle_types), false);
SELECT setval('public.vehicles_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.vehicles), false);
SELECT setval('public.memberships_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.memberships), false);
SELECT setval('public.operator_shifts_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.operator_shifts), false);
SELECT setval('public.tickets_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.tickets), false);
SELECT setval('public.parking_sessions_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.parking_sessions), false);
SELECT setval('public.payments_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.payments), false);
SELECT setval('public.shift_summaries_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.shift_summaries), false);
SELECT setval('public.device_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.device_logs), false);
SELECT setval('public.gate_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.gate_logs), false);
SELECT setval('public.system_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.system_logs), false);
SELECT setval('public.parking_statistics_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.parking_statistics), false);
SELECT setval('public.holidays_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.holidays), false);
SELECT setval('public.notifications_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.notifications), false);
SELECT setval('public.user_activity_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.user_activity_logs), false);
SELECT setval('public.user_sessions_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.user_sessions), false);
SELECT setval('public.device_health_checks_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.device_health_checks), false);
SELECT setval('public.parking_fees_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.parking_fees), false);
SELECT setval('public.audit_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.audit_logs), false);
SELECT setval('public.payment_transaction_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.payment_transaction), false);
SELECT setval('public.backup_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.backup_logs), false);
SELECT setval('public.parking_area_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.parking_area), false);

-- Print completion message
\echo 'All dummy data has been imported successfully!' 