import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/services/ErrorHandler';
import { User, UserRole } from '../entities/User';
import { Logger } from '../../shared/services/Logger';

interface JwtPayload {
    id: number;
    role: UserRole;
}

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new AppError(401, 'Authentication required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
        req.user = {
            id: decoded.id,
            role: decoded.role
        } as User;

        next();
    } catch (error) {
        Logger.getInstance().error('Authentication error:', error);
        next(new AppError(401, 'Invalid authentication token'));
    }
};

export const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await auth(req, res, () => {
            if (req.user?.role !== UserRole.ADMIN) {
                throw new AppError(403, 'Admin access required');
            }
            next();
        });
    } catch (error) {
        next(error);
    }
};

export const operatorAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await auth(req, res, () => {
            if (req.user?.role !== UserRole.OPERATOR && req.user?.role !== UserRole.ADMIN) {
                throw new AppError(403, 'Operator access required');
            }
            next();
        });
    } catch (error) {
        next(error);
    }
}; 