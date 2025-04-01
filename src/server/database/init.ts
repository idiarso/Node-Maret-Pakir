import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../../shared/config/database';
import bcrypt from 'bcrypt';
import { VehicleType, UserRole } from '../../shared/types';

async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Read and execute schema.sql
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSQL);

    // Create default admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (username, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', passwordHash, 'System Administrator', UserRole.ADMIN]
    );

    // Insert default parking rates
    const vehicleTypes = Object.values(VehicleType);
    for (const type of vehicleTypes) {
      await client.query(
        `INSERT INTO parking_rates (vehicle_type, base_rate, hourly_rate, maximum_daily_rate, effective_from)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)
         ON CONFLICT DO NOTHING`,
        [
          type,
          type === VehicleType.MOTORCYCLE ? 10 : type === VehicleType.CAR ? 20 : 30, // Base rate
          type === VehicleType.MOTORCYCLE ? 5 : type === VehicleType.CAR ? 10 : 15,  // Hourly rate
          type === VehicleType.MOTORCYCLE ? 50 : type === VehicleType.CAR ? 100 : 150 // Max daily rate
        ]
      );
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase; 