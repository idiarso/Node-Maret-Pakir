# Parking System - Database Dummy Data

This directory contains SQL dump files to populate the parking system database with dummy data for development and testing purposes.

## Files Overview

- `01_users.sql` - User accounts data
- `02_devices.sql` - Parking devices data (cameras, gates, etc)
- `03_vehicle_types.sql` - Vehicle type definitions
- `04_vehicles.sql` - Vehicles data
- `05_memberships.sql` - Vehicle membership data
- `06_operator_shifts.sql` - Operator shift data
- `07_tickets.sql` - Parking tickets data
- `08_parking_sessions.sql` - Parking session data
- `09_payments.sql` - Payment data
- `10_shift_summaries.sql` - Shift summary data
- `11_logs.sql` - System, device, and gate logs
- `12_parking_area.sql` - Parking area data
- `13_statistics.sql` - Parking statistics and other data
- `14_additional_data.sql` - Audit logs, payment transactions, etc.
- `import_all_data.sql` - Main script to import all data

## Usage

### Import All Data at Once

To import all the dummy data at once, use:

```bash
psql -U postgres -d your_database_name -f import_all_data.sql
```

### Import Individual Files

If you want to import files individually:

```bash
psql -U postgres -d your_database_name -f 01_users.sql
```

**Important**: Some tables have foreign key constraints. The `import_all_data.sql` file imports them in the correct order to avoid constraint violations. If importing manually, ensure you follow the correct order.

## Note About Foreign Key Constraints

The files are ordered to respect foreign key constraints. In particular, note that:

1. `parking_area` data (file 12) must be imported before `parking_sessions` (file 8) due to foreign key constraints
2. `users` (file 1) should be imported before most other tables that reference user IDs
3. `vehicle_types` (file 3) should be imported before `tickets` (file 7)

If you encounter foreign key constraint errors, ensure you're importing the files in the correct order.

## Reset Sequences

The `import_all_data.sql` file includes commands to reset all sequences based on the current maximum ID values. This ensures that new records will use correct ID values that don't conflict with the imported data.

## Data Date Range

The dummy data covers operations from 2025-04-01 to 2025-04-02. 