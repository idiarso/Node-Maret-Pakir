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
        // In a real application, you would hash the password and compare it
        if (password === user.password) {
            return { id: user.id, username: user.username, role: user.role };
        }
        return null;
    } catch (err) {
        console.error('Error authenticating user:', err);
        throw err;
    }
};

module.exports = {
    initDatabase,
    getParkingTickets,
    createParkingTicket,
    updateParkingTicket,
    getParkingRates
};