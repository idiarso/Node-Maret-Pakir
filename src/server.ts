import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createUserRouter } from './routes/user.routes';
import { createVehicleRouter } from './routes/vehicle.routes';
import { createPaymentRouter } from './routes/payment.routes';
import { createSettingsRouter } from './routes/settings.routes';
import { WebSocketServer } from 'ws';
import { HardwareManager } from './services/hardware.manager';
import { TicketController } from './controllers/ticket.controller';
import { authMiddleware, authenticatedHandler } from './middleware/auth.middleware';
import dotenv from 'dotenv';
import { UserRole } from './shared/types';
import AppDataSource, { initializeDatabase } from './server/config/ormconfig';
import { Logger } from './shared/services/Logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const logger = Logger.getInstance();

// Hardware configuration
const hardwareManager = new HardwareManager(
  {
    port: process.env.PRINTER_PORT || 'COM1',
    baudRate: parseInt(process.env.PRINTER_BAUD_RATE || '9600'),
  },
  {
    port: process.env.GATE_PORT || 'COM2',
    baudRate: parseInt(process.env.GATE_BAUD_RATE || '9600'),
  }
);

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Initialize controllers
    const ticketController = new TicketController(AppDataSource, hardwareManager);

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
    app.use('/api/users', createUserRouter(AppDataSource));
    app.use('/api/vehicles', createVehicleRouter(AppDataSource));
    app.use('/api/payments', createPaymentRouter(AppDataSource));
    app.use('/api/settings', createSettingsRouter(AppDataSource));
    app.post('/api/tickets', authMiddleware([UserRole.OPERATOR]), authenticatedHandler(ticketController.generateTicket));
    app.get('/api/tickets/:barcode', authMiddleware([UserRole.OPERATOR]), authenticatedHandler(ticketController.validateTicket));

    // WebSocket server
    const wss = new WebSocketServer({ noServer: true });

    // Start server
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });

    // Handle WebSocket upgrade
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Cleanup on server shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      hardwareManager.dispose();
      await AppDataSource.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      hardwareManager.dispose();
      await AppDataSource.destroy();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 