import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createUserRouter } from './routes/user.routes';
import { createVehicleRouter } from './routes/vehicle.routes';
import { createPaymentRouter } from './routes/payment.routes';
import { WebSocketServer } from 'ws';
import { HardwareManager } from './services/hardware.manager';
import { TicketController } from './controllers/ticket.controller';
import { authMiddleware, authenticatedHandler } from './middleware/auth.middleware';
import dotenv from 'dotenv';
import { UserRole } from './shared/types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const db = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'parking_system',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

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

// Initialize controllers
const ticketController = new TicketController(db, hardwareManager);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', createUserRouter(db));
app.use('/api/vehicles', createVehicleRouter(db));
app.use('/api/payments', createPaymentRouter(db));
app.post('/api/tickets', authMiddleware([UserRole.OPERATOR]), authenticatedHandler(ticketController.generateTicket));
app.get('/api/tickets/:barcode', authMiddleware([UserRole.OPERATOR]), authenticatedHandler(ticketController.validateTicket));

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  hardwareManager.dispose();
  db.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  hardwareManager.dispose();
  db.end();
  process.exit(0);
}); 