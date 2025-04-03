const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'parking_system1',
    password: 'postgres',
    port: 5432,
});

const initDatabase = async () => {
    const client = await pool.connect();
    try {
        // Create tables if they don't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS parking_tickets (
                id VARCHAR(10) PRIMARY KEY,
                plate_number VARCHAR(20) NOT NULL,
                vehicle_type VARCHAR(10) NOT NULL,
                entry_time TIMESTAMP NOT NULL,
                status VARCHAR(10) NOT NULL,
                fee INTEGER
            );

            CREATE TABLE IF NOT EXISTS parking_rates (
                id SERIAL PRIMARY KEY,
                vehicle_type VARCHAR(10) UNIQUE NOT NULL,
                flat_rate INTEGER NOT NULL,
                description TEXT
            );
            
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                ticket_id VARCHAR(10) REFERENCES parking_tickets(id),
                amount NUMERIC(10, 2) NOT NULL,
                payment_method VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
                transaction_id VARCHAR(50),
                paid_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default parking rates if they don't exist
        await client.query(`
            INSERT INTO parking_rates (vehicle_type, flat_rate, description)
            VALUES 
                ('motor', 2000, 'Tarif parkir motor'),
                ('mobil', 5000, 'Tarif parkir mobil')
            ON CONFLICT (vehicle_type) DO NOTHING;

            -- Insert default admin user
            INSERT INTO users (username, password, role)
            VALUES ('admin', '$2b$10$xLrv0mLKPmVWDOEpBPYGzeYyQn/yndm4CvE0tB33iW0S3jXWoGfxq', 'admin')
            ON CONFLICT (username) DO NOTHING;
            
            -- Insert sample payments data if payments table is empty
            INSERT INTO payments (ticket_id, amount, payment_method, status, transaction_id, paid_by)
            SELECT
                t.id,
                t.fee,
                CASE
                    WHEN random() < 0.4 THEN 'CASH'
                    WHEN random() < 0.7 THEN 'CARD'
                    ELSE 'EWALLET'
                END,
                'COMPLETED',
                'TRANS-' || floor(random() * 1000000)::text,
                1
            FROM
                parking_tickets t
            WHERE
                t.status = 'completed' AND
                t.fee > 0 AND
                NOT EXISTS (SELECT 1 FROM payments WHERE ticket_id = t.id)
            LIMIT 10;
        `);

    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        client.release();
    }
};

const getParkingTickets = async () => {
    try {
        const result = await pool.query(
            'SELECT * FROM parking_tickets ORDER BY entry_time DESC'
        );
        return result.rows;
    } catch (err) {
        console.error('Error fetching parking tickets:', err);
        throw err;
    }
};

const createParkingTicket = async (ticket) => {
    try {
        const result = await pool.query(
            'INSERT INTO parking_tickets (id, plate_number, vehicle_type, entry_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [ticket.id, ticket.plateNumber, ticket.vehicleType, ticket.entryTime, ticket.status]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error creating parking ticket:', err);
        throw err;
    }
};

const updateParkingTicket = async (ticketId, fee) => {
    try {
        const result = await pool.query(
            'UPDATE parking_tickets SET status = $1, fee = $2 WHERE id = $3 RETURNING *',
            ['completed', fee, ticketId]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error updating parking ticket:', err);
        throw err;
    }
};

const getDashboardStats = async () => {
    try {
        // Get active parking count
        const activeCount = await pool.query(
            "SELECT vehicle_type, COUNT(*) as count FROM parking_tickets WHERE status = 'active' GROUP BY vehicle_type"
        );

        // Get today's income
        const today = new Date().toISOString().split('T')[0];
        const todayIncome = await pool.query(
            "SELECT COALESCE(SUM(fee), 0) as total FROM parking_tickets WHERE status = 'completed' AND DATE(entry_time) = $1",
            [today]
        );

        // Get total vehicles today
        const todayVehicles = await pool.query(
            'SELECT COUNT(*) as count FROM parking_tickets WHERE DATE(entry_time) = $1',
            [today]
        );

        return {
            activeParking: activeCount.rows,
            todayIncome: todayIncome.rows[0].total,
            todayVehicles: todayVehicles.rows[0].count
        };
    } catch (err) {
        console.error('Error getting dashboard stats:', err);
        throw err;
    }
};

const getDailyIncomeStats = async (date) => {
    try {
        const result = await pool.query(
            `SELECT 
                vehicle_type,
                COUNT(*) as total_vehicles,
                COALESCE(SUM(fee), 0) as total_income
            FROM parking_tickets
            WHERE DATE(entry_time) = $1 AND status = 'completed'
            GROUP BY vehicle_type`,
            [date]
        );
        return result.rows;
    } catch (err) {
        console.error('Error getting daily income stats:', err);
        throw err;
    }
};

const getMonthlyIncomeStats = async (month, year) => {
    try {
        const result = await pool.query(
            `SELECT 
                DATE(entry_time) as date,
                COUNT(*) as total_vehicles,
                COALESCE(SUM(fee), 0) as total_income
            FROM parking_tickets
            WHERE EXTRACT(MONTH FROM entry_time) = $1
            AND EXTRACT(YEAR FROM entry_time) = $2
            AND status = 'completed'
            GROUP BY DATE(entry_time)
            ORDER BY date`,
            [month, year]
        );
        return result.rows;
    } catch (err) {
        console.error('Error getting monthly income stats:', err);
        throw err;
    }
};

const getParkingRates = async () => {
    try {
        const result = await pool.query('SELECT * FROM parking_rates');
        return result.rows.reduce((acc, rate) => {
            acc[rate.vehicle_type] = rate.flat_rate;
            return acc;
        }, {});
    } catch (err) {
        console.error('Error fetching parking rates:', err);
        throw err;
    }
};

const createParkingRate = async (rate) => {
    try {
        const result = await pool.query(
            'INSERT INTO parking_rates (vehicle_type, flat_rate, description) VALUES ($1, $2, $3) RETURNING *',
            [rate.vehicleType, rate.flatRate, rate.description]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error creating parking rate:', err);
        throw err;
    }
};

const updateParkingRate = async (id, rate) => {
    try {
        const result = await pool.query(
            'UPDATE parking_rates SET flat_rate = $1, description = $2 WHERE id = $3 RETURNING *',
            [rate.flatRate, rate.description, id]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error updating parking rate:', err);
        throw err;
    }
};

const deleteParkingRate = async (id) => {
    try {
        await pool.query('DELETE FROM parking_rates WHERE id = $1', [id]);
        return true;
    } catch (err) {
        console.error('Error deleting parking rate:', err);
        throw err;
    }
};

const authenticateUser = async (username, password) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return null;
        const user = result.rows[0];
        
        // For development, allow direct password matching
        // In a real production app, you would use bcrypt.compare
        if (password === 'admin' && user.username === 'admin') {
            return { id: user.id, username: user.username, role: user.role };
        }
        return null;
    } catch (err) {
        console.error('Error authenticating user:', err);
        throw err;
    }
};

// Get all payments with license plate information
const getPayments = async () => {
    try {
        console.log('DB: Executing payment query with proper column names...');
        const result = await pool.query(`
            SELECT 
                p.id,
                p.ticket_id,
                p.amount,
                p.payment_method as "paymentMethod", 
                p.status,
                p.transaction_id as "transactionId",
                p.paid_by as "paid_by",
                p.created_at as "createdAt",
                p.updated_at as "updatedAt",
                t.plate_number as "licensePlate",
                t.id as "ticketNumber"
            FROM 
                payments p
            LEFT JOIN 
                parking_tickets t ON p.ticket_id = t.id
            ORDER BY 
                p.created_at DESC
        `);
        console.log('DB: Payment query successful, rows returned:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('DB: No payment data found in database!');
        } else {
            console.log('DB: First payment data:', JSON.stringify(result.rows[0]));
        }
        
        return result.rows;
    } catch (err) {
        console.error('Error fetching payments:', err);
        throw err;
    }
};

// Create new payment
const createPayment = async (payment) => {
    try {
        const result = await pool.query(
            `INSERT INTO payments 
            (ticket_id, amount, payment_method, status, transaction_id, paid_by) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [
                payment.ticketId, 
                payment.amount, 
                payment.paymentMethod, 
                payment.status || 'COMPLETED',
                payment.transactionId || `TRANS-${Date.now()}`,
                payment.paidBy || 1
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error creating payment:', err);
        throw err;
    }
};

// Get payment by ID
const getPaymentById = async (id) => {
    try {
        const result = await pool.query(
            `SELECT 
                p.*,
                t.plate_number as license_plate,
                t.id as ticket_number
            FROM 
                payments p
            LEFT JOIN 
                parking_tickets t ON p.ticket_id = t.id
            WHERE 
                p.id = $1`,
            [id]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error fetching payment by ID:', err);
        throw err;
    }
};

// Update payment
const updatePayment = async (id, payment) => {
    try {
        const result = await pool.query(
            `UPDATE payments 
            SET 
                amount = $1, 
                payment_method = $2, 
                status = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 
            RETURNING *`,
            [
                payment.amount,
                payment.paymentMethod,
                payment.status,
                id
            ]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error updating payment:', err);
        throw err;
    }
};

// Delete payment
const deletePayment = async (id) => {
    try {
        await pool.query('DELETE FROM payments WHERE id = $1', [id]);
        return true;
    } catch (err) {
        console.error('Error deleting payment:', err);
        throw err;
    }
};

module.exports = {
    initDatabase,
    getParkingTickets,
    createParkingTicket,
    updateParkingTicket,
    getParkingRates,
    createParkingRate,
    updateParkingRate,
    deleteParkingRate,
    authenticateUser,
    getDashboardStats,
    getDailyIncomeStats,
    getMonthlyIncomeStats,
    getPayments,
    createPayment,
    getPaymentById,
    updatePayment,
    deletePayment
};