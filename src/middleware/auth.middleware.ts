import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, TokenPayload, AuthenticatedRequest, AuthenticatedRequestHandler } from '../shared/types';

export const authMiddleware = (requiredRoles: UserRole[] = []): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      (req as AuthenticatedRequest).user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const authenticatedHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  handler: (req: AuthenticatedRequest, res: Response<ResBody>) => Promise<void>
): AuthenticatedRequestHandler => {
  return async (req: Request, res: Response<ResBody>, next: NextFunction): Promise<void> => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
};