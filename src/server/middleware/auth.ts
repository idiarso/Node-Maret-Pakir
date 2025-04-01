import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/services/ErrorHandler';
import { User, UserRole } from '../entities/User';
import { Logger } from '../../shared/services/Logger';

interface JwtPayload {
    id: number;
    role: UserRole;
}

interface AuthRequest extends Request {
    user?: any;
}

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication token required" });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

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