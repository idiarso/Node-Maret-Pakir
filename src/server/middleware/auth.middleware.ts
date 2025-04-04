import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';
import { UserRole } from '../../shared/types';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

interface AuthenticatedRequest extends Request {
  user?: User;
}

interface TokenPayload {
  id: string;
  role: UserRole;
}

export const authMiddleware = (allowedRoles?: UserRole[]) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });

      if (!user) {
        logger.warn(`User not found: ${decoded.id}`);
        return res.status(401).json({ message: 'User not found' });
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        logger.warn(`User ${user.id} with role ${user.role} attempted to access route restricted to ${allowedRoles.join(', ')}`);
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(error);
  }
};

export type { AuthenticatedRequest }; 