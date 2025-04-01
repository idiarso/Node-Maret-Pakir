-- Add shift type enum
CREATE TYPE shift_type AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- Add shift status enum
CREATE TYPE shift_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'HANDOVER_PENDING');

-- Add equipment status tracking to operator_shifts
ALTER TABLE operator_shifts
ADD COLUMN shift_type shift_type NOT NULL,
ADD COLUMN status shift_status DEFAULT 'ACTIVE',
ADD COLUMN initial_cash_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN final_cash_amount DECIMAL(10,2),
ADD COLUMN equipment_status JSONB DEFAULT '{}',
ADD COLUMN handover_notes TEXT,
ADD COLUMN handover_accepted_by INTEGER REFERENCES users(id),
ADD COLUMN handover_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for shift management
CREATE INDEX idx_operator_shifts_operator_id ON operator_shifts(operator_id);
CREATE INDEX idx_operator_shifts_shift_type ON operator_shifts(shift_type);
CREATE INDEX idx_operator_shifts_status ON operator_shifts(status);
CREATE INDEX idx_operator_shifts_start_time ON operator_shifts(start_time);
CREATE INDEX idx_operator_shifts_end_time ON operator_shifts(end_time);

-- Add cash reconciliation table
CREATE TABLE IF NOT EXISTS cash_reconciliations (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER REFERENCES operator_shifts(id),
    expected_amount DECIMAL(10,2) NOT NULL,
    actual_amount DECIMAL(10,2) NOT NULL,
    difference DECIMAL(10,2) NOT NULL,
    notes TEXT,
    reconciled_by INTEGER REFERENCES users(id),
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add equipment status history table
CREATE TABLE IF NOT EXISTS equipment_status_history (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER REFERENCES operator_shifts(id),
    device_id INTEGER REFERENCES devices(id),
    status device_status NOT NULL,
    notes TEXT,
    reported_by INTEGER REFERENCES users(id),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for new tables
CREATE INDEX idx_cash_reconciliations_shift_id ON cash_reconciliations(shift_id);
CREATE INDEX idx_equipment_status_history_shift_id ON equipment_status_history(shift_id);
CREATE INDEX idx_equipment_status_history_device_id ON equipment_status_history(device_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_cash_reconciliations_updated_at
    BEFORE UPDATE ON cash_reconciliations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to calculate shift statistics
CREATE OR REPLACE FUNCTION calculate_shift_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update shift summary with final amounts
    UPDATE shift_summaries
    SET 
        total_transactions = (
            SELECT COUNT(*) 
            FROM payments 
            WHERE payment_time BETWEEN NEW.start_time AND NEW.end_time
        ),
        total_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments 
            WHERE payment_time BETWEEN NEW.start_time AND NEW.end_time
        ),
        cash_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments 
            WHERE payment_time BETWEEN NEW.start_time AND NEW.end_time
            AND payment_method = 'CASH'
        ),
        non_cash_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM payments 
            WHERE payment_time BETWEEN NEW.start_time AND NEW.end_time
            AND payment_method != 'CASH'
        )
    WHERE operator_id = NEW.operator_id
    AND shift_start = NEW.start_time;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for shift statistics
CREATE TRIGGER calculate_shift_statistics_trigger
    AFTER UPDATE ON operator_shifts
    FOR EACH ROW
    WHEN (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED')
    EXECUTE FUNCTION calculate_shift_statistics(); 