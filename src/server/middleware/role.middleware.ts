import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

// Role middleware for protecting routes based on user roles
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      
      // If no user (should be caught by auth middleware)
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Check if user role is in allowed roles
      if (!allowedRoles.includes(user.role)) {
        logger.warn(`Access denied for user ${user.id} with role ${user.role}. Required roles: ${allowedRoles.join(', ')}`);
        return res.status(403).json({ 
          message: 'Access denied',
          requiredRoles: allowedRoles
        });
      }
      
      // User has required role
      next();
    } catch (error) {
      logger.error('Error in role middleware:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}; 