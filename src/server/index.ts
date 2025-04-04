import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import AppDataSource, { initializeDatabase } from './config/ormconfig';
import { createTicketRouter } from './routes/ticket.routes';
import deviceRoutes from './routes/device.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import parkingAreaRoutes from './routes/parkingArea.routes';
import parkingRateRoutes from './routes/parkingRate.routes';
import parkingSessionRoutes from './routes/parkingSession.routes';
import gateRoutes from './routes/gate.routes';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';
import paymentsRoutes from './routes/payments';
import shiftRoutes from './routes/shift.routes';
import { Logger } from '../shared/services/Logger';
import { errorHandler } from './middleware';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { CacheService } from './services/cache.service';
import backupRoutes from './routes/backup.routes';
import { HardwareManager } from '../services/hardware.manager';

const app = express();
const logger = Logger.getInstance();
const port = process.env.PORT || 3000;

// Initialize services
const cacheService = CacheService.getInstance();
const hardwareManager = new HardwareManager(
  {
    port: process.env.PRINTER_PORT || '/dev/usb/lp0',
    baudRate: parseInt(process.env.PRINTER_BAUD_RATE || '9600')
  },
  {
    port: process.env.GATE_PORT || '/dev/ttyUSB1',
    baudRate: parseInt(process.env.GATE_BAUD_RATE || '9600')
  }
);

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(express.json());
app.use(limiter); // Apply rate limiting

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files should be served after API routes
app.use(express.static(path.join(__dirname, '../../public')));

// Routes - ensure all are properly imported as router functions
app.use('/api/tickets', createTicketRouter());
app.use('/api/devices', deviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parking-areas', parkingAreaRoutes);
app.use('/api/parking-rates', parkingRateRoutes);
app.use('/api/parking-sessions', parkingSessionRoutes);
app.use('/api/gates', gateRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/backup', backupRoutes);

// Error handling middleware
app.use(errorHandler);

// Settings API routes
app.get('/api/settings/language', (req, res) => {
  res.json({
    id: 1,
    defaultLanguage: 'id',
    availableLanguages: ['en', 'id'],
    translations: {
      "parkingSystem": {
        "en": "Parking System",
        "id": "Sistem Parkir"
      },
      "welcomeMessage": {
        "en": "Welcome",
        "id": "Selamat Datang"
      }
    }
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    logger.info('Database connection initialized');

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer(); 