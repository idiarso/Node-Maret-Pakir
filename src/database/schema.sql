-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    barcode UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number VARCHAR(20) NOT NULL,
    entry_time TIMESTAMP NOT NULL DEFAULT NOW(),
    operator_id VARCHAR(10) NOT NULL,
    vehicle_type VARCHAR(20) DEFAULT 'car',
    additional_info TEXT,
    exit_time TIMESTAMP,
    payment_amount DECIMAL(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_barcode ON tickets(barcode);
CREATE INDEX IF NOT EXISTS idx_tickets_plate_number ON tickets(plate_number);
CREATE INDEX IF NOT EXISTS idx_tickets_entry_time ON tickets(entry_time);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create vehicle_types table for reference
CREATE TABLE IF NOT EXISTS vehicle_types (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default vehicle types
INSERT INTO vehicle_types (id, name, base_price) VALUES
    ('car', 'Car', 5000),
    ('motorcycle', 'Motorcycle', 3000),
    ('truck', 'Truck', 8000)
ON CONFLICT (id) DO NOTHING; 