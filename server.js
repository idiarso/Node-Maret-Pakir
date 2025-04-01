const express = require('express');
const cors = require('cors');
const { initDatabase, getParkingTickets, createParkingTicket, updateParkingTicket, getParkingRates, createParkingRate, updateParkingRate, deleteParkingRate, authenticateUser, getDashboardStats } = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.');

// Middleware untuk verifikasi token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token tidak valid' });
        req.user = user;
        next();
    });
};

// Initialize database
initDatabase().catch(console.error);

// Get all parking tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const tickets = await getParkingTickets();
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new parking ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const ticket = await createParkingTicket(req.body);
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update parking ticket (checkout)
app.put('/api/tickets/:id', async (req, res) => {
    try {
        const { fee } = req.body;
        const ticket = await updateParkingTicket(req.params.id, fee);
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await authenticateUser(username, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        const token = jwt.sign(user, JWT_SECRET);
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get parking rates
app.get('/api/rates', async (req, res) => {
    try {
        const rates = await getParkingRates();
        res.json(rates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new parking rate (protected)
app.post('/api/rates', authenticateToken, async (req, res) => {
    try {
        const rate = await createParkingRate(req.body);
        res.json(rate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update parking rate (protected)
app.put('/api/rates/:id', authenticateToken, async (req, res) => {
    try {

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get daily income report
app.get('/api/reports/daily-income', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        const dailyStats = await getDailyIncomeStats(date);
        res.json(dailyStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get monthly income report
app.get('/api/reports/monthly-income', authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        const monthlyStats = await getMonthlyIncomeStats(month, year);
        res.json(monthlyStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


        const rate = await updateParkingRate(req.params.id, req.body);
        res.json(rate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete parking rate (protected)
app.delete('/api/rates/:id', authenticateToken, async (req, res) => {
    try {
        await deleteParkingRate(req.params.id);
        res.json({ message: 'Tarif parkir berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});