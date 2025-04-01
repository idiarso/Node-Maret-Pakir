import { Pool } from 'pg';
import { hash } from 'bcrypt';
import dotenv from 'dotenv';
import { UserRole } from '../shared/types';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create test users
    const adminPassword = await hash('admin123', 10);
    const operatorPassword = await hash('operator123', 10);

    await client.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@example.com', adminPassword, 'Admin User', UserRole.ADMIN]
    );

    await client.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['operator@example.com', operatorPassword, 'Operator User', UserRole.OPERATOR]
    );

    // Create test vehicles
    const vehicles = [
      { plateNumber: 'ABC123', make: 'Toyota', model: 'Camry', color: 'Silver', type: 'CAR' },
      { plateNumber: 'XYZ789', make: 'Honda', model: 'Civic', color: 'Blue', type: 'CAR' },
      { plateNumber: 'DEF456', make: 'Ford', model: 'F-150', color: 'Red', type: 'TRUCK' },
    ];

    for (const vehicle of vehicles) {
      await client.query(
        `INSERT INTO vehicles (plate_number, make, model, color, type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (plate_number) DO NOTHING`,
        [vehicle.plateNumber, vehicle.make, vehicle.model, vehicle.color, vehicle.type]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase().catch(error => {
  console.error('❌ Initialization script failed:', error);
  process.exit(1);
}); 