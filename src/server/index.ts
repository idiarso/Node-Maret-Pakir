import express from 'express';
import cors from 'cors';
import path from 'path';
import AppDataSource from './config/ormconfig';
import ticketRoutes from './routes/ticket.routes';
import deviceRoutes from './routes/device.routes';
import { Logger } from '../shared/services/Logger';
import { errorHandler } from './middleware';

const app = express();
const logger = Logger.getInstance();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/devices', deviceRoutes);

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        logger.info('Database connection established');
    })
    .catch((error: Error) => {
        logger.error('Error connecting to database:', error);
        process.exit(1);
    });

export default app; 