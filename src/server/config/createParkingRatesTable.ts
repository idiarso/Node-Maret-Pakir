import AppDataSource from "./ormconfig";

async function createParkingRatesTable() {
    try {
        await AppDataSource.initialize();
        
        // Create the table
        await AppDataSource.query(`
            CREATE TABLE IF NOT EXISTS parking_rates (
                id SERIAL PRIMARY KEY,
                vehicle_type VARCHAR NOT NULL,
                base_rate DECIMAL(10,2) NOT NULL,
                hourly_rate DECIMAL(10,2) NOT NULL,
                max_daily_rate DECIMAL(10,2) NOT NULL,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            )
        `);
        
        // Insert sample data - first delete existing data to avoid duplicates
        await AppDataSource.query(`DELETE FROM parking_rates WHERE id IN (SELECT id FROM parking_rates LIMIT 4)`);
        
        await AppDataSource.query(`
            INSERT INTO parking_rates (vehicle_type, base_rate, hourly_rate, max_daily_rate)
            VALUES 
                ('Motor', 2500.00, 1000.00, 10000.00),
                ('Mobil', 5000.00, 2000.00, 20000.00),
                ('Truk', 10000.00, 5000.00, 50000.00),
                ('Bus', 10000.00, 5000.00, 50000.00)
        `);
        
        console.log('Parking rates table created and sample data inserted successfully');
    } catch (error) {
        console.error('Error creating parking_rates table:', error);
    } finally {
        try {
            await AppDataSource.destroy();
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }
}

createParkingRatesTable().catch(console.error);