-- Create enum types
CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR', 'USER');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT');
CREATE TYPE vehicle_type AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN');
CREATE TYPE device_type AS ENUM ('PRINTER', 'SCANNER', 'GATE', 'ARDUINO', 'LOOP_DETECTOR');
CREATE TYPE device_status AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
CREATE TYPE gate_status AS ENUM ('OPEN', 'CLOSED', 'ERROR');
CREATE TYPE notification_type AS ENUM ('SYSTEM', 'ERROR', 'WARNING', 'INFO');
CREATE TYPE notification_status AS ENUM ('UNREAD', 'READ', 'ARCHIVED');
CREATE TYPE log_type AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_areas table
CREATE TABLE IF NOT EXISTS parking_areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL,
  occupied INTEGER DEFAULT 0,
  vehicle_type vehicle_type,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  type vehicle_type NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  owner_contact VARCHAR(50),
  registration_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_sessions table
CREATE TABLE IF NOT EXISTS parking_sessions (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  parking_area_id INTEGER REFERENCES parking_areas(id),
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP WITH TIME ZONE,
  entry_gate_id INTEGER,
  exit_gate_id INTEGER,
  entry_operator_id INTEGER REFERENCES users(id),
  exit_operator_id INTEGER REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  parking_session_id INTEGER REFERENCES parking_sessions(id) ON DELETE CASCADE,
  barcode VARCHAR(50) UNIQUE NOT NULL,
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_rates table
CREATE TABLE IF NOT EXISTS parking_rates (
  id SERIAL PRIMARY KEY,
  vehicle_type vehicle_type NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  grace_period INTEGER DEFAULT 15, -- in minutes
  is_weekend_rate BOOLEAN DEFAULT false,
  is_holiday_rate BOOLEAN DEFAULT false,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_fees table
CREATE TABLE IF NOT EXISTS parking_fees (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  base_rate DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  hourly_charges DECIMAL(10,2) NOT NULL,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  parking_fee_id INTEGER REFERENCES parking_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  transaction_id VARCHAR(100) UNIQUE,
  payment_time TIMESTAMP WITH TIME ZONE,
  operator_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shift_summaries table
CREATE TABLE IF NOT EXISTS shift_summaries (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER REFERENCES users(id),
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE,
  total_transactions INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  cash_amount DECIMAL(10,2) DEFAULT 0,
  non_cash_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type device_type NOT NULL,
  location VARCHAR(100),
  port VARCHAR(50),
  ip_address VARCHAR(45),
  status device_status NOT NULL DEFAULT 'ACTIVE',
  last_ping TIMESTAMP WITH TIME ZONE,
  configuration JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create device_health_checks table
CREATE TABLE IF NOT EXISTS device_health_checks (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  response_time INTEGER, -- in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gates table
CREATE TABLE IF NOT EXISTS gates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  device_id INTEGER REFERENCES devices(id),
  status gate_status NOT NULL DEFAULT 'CLOSED',
  last_status_change TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gate_logs table
CREATE TABLE IF NOT EXISTS gate_logs (
  id SERIAL PRIMARY KEY,
  gate_id INTEGER REFERENCES gates(id),
  action VARCHAR(20) NOT NULL,
  triggered_by INTEGER REFERENCES users(id),
  status gate_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create device_logs table
CREATE TABLE IF NOT EXISTS device_logs (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id),
  type log_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  type log_type NOT NULL,
  source VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status notification_status DEFAULT 'UNREAD',
  recipient_id INTEGER REFERENCES users(id),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_statistics table
CREATE TABLE IF NOT EXISTS parking_statistics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  vehicle_type vehicle_type,
  total_vehicles INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_duration INTEGER DEFAULT 0, -- in minutes
  peak_hour INTEGER, -- 0-23
  occupancy_rate DECIMAL(5,2),
  peak_occupancy_time TIME,
  average_stay_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create backup_logs table
CREATE TABLE IF NOT EXISTS backup_logs (
  id SERIAL PRIMARY KEY,
  backup_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  status VARCHAR(20),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create operator_shifts table
CREATE TABLE IF NOT EXISTS operator_shifts (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER REFERENCES users(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  gate_id INTEGER REFERENCES gates(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function to calculate parking duration
CREATE OR REPLACE FUNCTION calculate_parking_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duration = EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function to update parking statistics
CREATE OR REPLACE FUNCTION update_parking_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily statistics when a parking session ends
  IF TG_OP = 'UPDATE' AND NEW.exit_time IS NOT NULL AND OLD.exit_time IS NULL THEN
    INSERT INTO parking_statistics (date, vehicle_type, total_vehicles, total_revenue)
    VALUES (
      DATE(NEW.exit_time),
      (SELECT type FROM vehicles WHERE id = NEW.vehicle_id),
      1,
      (SELECT total_amount FROM parking_fees WHERE ticket_id = (SELECT id FROM tickets WHERE parking_session_id = NEW.id))
    )
    ON CONFLICT (date) DO UPDATE
    SET 
      total_vehicles = parking_statistics.total_vehicles + 1,
      total_revenue = parking_statistics.total_revenue + EXCLUDED.total_revenue,
      updated_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function to update parking area occupancy
CREATE OR REPLACE FUNCTION update_parking_area_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE parking_areas
    SET occupied = occupied + 1
    WHERE id = NEW.parking_area_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.exit_time IS NOT NULL AND OLD.exit_time IS NULL THEN
    UPDATE parking_areas
    SET occupied = occupied - 1
    WHERE id = NEW.parking_area_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_sessions_updated_at
  BEFORE UPDATE ON parking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_fees_updated_at
  BEFORE UPDATE ON parking_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gates_updated_at
  BEFORE UPDATE ON gates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parking_statistics_updated_at
  BEFORE UPDATE ON parking_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calculate_parking_duration_trigger
  BEFORE INSERT OR UPDATE ON parking_fees
  FOR EACH ROW
  EXECUTE FUNCTION calculate_parking_duration();

CREATE TRIGGER update_parking_statistics_trigger
  AFTER UPDATE ON parking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_statistics();

CREATE TRIGGER update_parking_area_occupancy_trigger
  AFTER INSERT OR UPDATE ON parking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_area_occupancy();

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_parking_sessions_vehicle_id ON parking_sessions(vehicle_id);
CREATE INDEX idx_parking_sessions_entry_time ON parking_sessions(entry_time);
CREATE INDEX idx_parking_sessions_exit_time ON parking_sessions(exit_time);
CREATE INDEX idx_parking_sessions_status ON parking_sessions(status);
CREATE INDEX idx_tickets_barcode ON tickets(barcode);
CREATE INDEX idx_tickets_plate_number ON tickets(plate_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_parking_rates_vehicle_type ON parking_rates(vehicle_type);
CREATE INDEX idx_parking_rates_effective_from ON parking_rates(effective_from);
CREATE INDEX idx_parking_fees_ticket_id ON parking_fees(ticket_id);
CREATE INDEX idx_payments_parking_fee_id ON payments(parking_fee_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_gates_status ON gates(status);
CREATE INDEX idx_gate_logs_gate_id ON gate_logs(gate_id);
CREATE INDEX idx_device_logs_device_id ON device_logs(device_id);
CREATE INDEX idx_system_logs_type ON system_logs(type);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_parking_statistics_date ON parking_statistics(date);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_parking_sessions_combined ON parking_sessions(vehicle_id, entry_time, status);
CREATE INDEX idx_payments_date ON payments(payment_time);
CREATE INDEX idx_tickets_combined ON tickets(barcode, status, entry_time);

-- Add constraints
ALTER TABLE parking_fees ADD CONSTRAINT check_positive_amount CHECK (total_amount >= 0);
ALTER TABLE parking_rates ADD CONSTRAINT check_valid_rates CHECK (hourly_rate > 0 AND base_rate >= 0);
ALTER TABLE parking_areas ADD CONSTRAINT check_valid_capacity CHECK (capacity > 0);
ALTER TABLE parking_areas ADD CONSTRAINT check_valid_occupancy CHECK (occupied >= 0 AND occupied <= capacity); 