import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../shared/services/Logger';

const logger = Logger.getInstance();

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error'
    });
}; 