import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { UserRole } from '../../shared/types';
import AppDataSource from '../config/ormconfig';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            logger.warn('Auth middleware: No authorization header');
            return res.status(401).json({ message: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            logger.warn('Auth middleware: No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id: decoded.id, active: true } });

            if (!user) {
                logger.warn(`Auth middleware: User not found or inactive (ID: ${decoded.id})`);
                return res.status(401).json({ message: 'User not found or inactive' });
            }

            // Attach user to request object
            req.user = user;
            next();
        } catch (jwtError) {
            logger.warn('Auth middleware: Invalid token', jwtError);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        logger.error('Auth middleware error:', error);
        next(error);
    }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        logger.warn('Admin middleware: Authentication required');
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== UserRole.ADMIN) {
        logger.warn(`Admin middleware: User ${req.user.id} (${req.user.username}) is not an admin`);
        return res.status(403).json({ message: 'Admin access required' });
    }

    next();
}; 