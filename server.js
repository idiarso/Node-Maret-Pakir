const express = require('express');
const cors = require('cors');
const { 
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
    getPayments,
    createPayment,
    getPaymentById,
    updatePayment,
    deletePayment 
} = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

const app = express();

// Konfigurasi CORS yang lebih spesifik untuk menghindari masalah
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());
app.use(express.static('.'));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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
initDatabase().catch(error => {
    console.error('Database initialization error:', error);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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

// Get all payments - public endpoint tanpa auth
app.get('/api/payments', async (req, res) => {
    try {
        console.log('API: Fetching payments from database...');
        const payments = await getPayments();
        console.log('API: Retrieved payments count:', payments.length);
        
        if (payments.length === 0) {
            console.log('API: No payments found in database');
        } else {
            console.log('API: Sample payment:', JSON.stringify(payments[0]));
        }
        
        // Set header untuk menghindari caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Kirim data apa adanya tanpa manipulasi tambahan
        res.json(payments);
    } catch (err) {
        console.error('Error fetching payments:', err);
        // Kirim pesan error yang lebih detail
        res.status(500).json({ 
            error: err.message,
            detail: 'Error while retrieving payments from database',
            timestamp: new Date().toISOString()
        });
    }
});

// Get payment by ID
app.get('/api/payments/:id', async (req, res) => {
    try {
        const payment = await getPaymentById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(payment);
    } catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create new payment
app.post('/api/payments', async (req, res) => {
    try {
        const payment = await createPayment(req.body);
        res.status(201).json(payment);
    } catch (err) {
        console.error('Error creating payment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update payment
app.put('/api/payments/:id', async (req, res) => {
    try {
        const payment = await updatePayment(req.params.id, req.body);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json(payment);
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete payment
app.delete('/api/payments/:id', async (req, res) => {
    try {
        await deletePayment(req.params.id);
        res.json({ message: 'Payment successfully deleted' });
    } catch (err) {
        console.error('Error deleting payment:', err);
        res.status(500).json({ error: err.message });
    }
});

// Catch-all route untuk menangani 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.url });
});

// Error handler untuk menangani exception yang tidak tertangkap
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log(`Database URL: ${process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/parking_system1'}`);
});