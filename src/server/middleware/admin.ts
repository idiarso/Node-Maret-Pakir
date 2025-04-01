import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/services/ErrorHandler';
import { Logger } from '../../shared/services/Logger';
import { UserRole } from '../../shared/types';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const logger = Logger.getInstance();
    
    try {
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }

        if (req.user.role !== UserRole.ADMIN) {
            logger.warn(`Unauthorized admin access attempt by user: ${req.user.id}`);
            throw new AppError(403, 'Admin access required');
        }

        next();
    } catch (error) {
        next(error);
    }
}; 