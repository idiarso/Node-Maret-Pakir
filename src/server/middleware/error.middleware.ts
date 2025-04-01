import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { JsonWebTokenError } from 'jsonwebtoken';
import { LoggerService } from '../services/logger.service';

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Error handler middleware
export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    LoggerService.error('Error occurred:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        user: req.user?.id
    });

    // Handle specific error types
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            error: error.name,
            message: error.message,
            details: error.details
        });
    }

    if (error instanceof QueryFailedError) {
        return res.status(400).json({
            error: 'DatabaseError',
            message: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    if (error instanceof JsonWebTokenError) {
        return res.status(401).json({
            error: 'AuthenticationError',
            message: 'Invalid or expired token'
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'ValidationError',
            message: 'Validation failed',
            details: error.message
        });
    }

    // Handle unknown errors
    return res.status(500).json({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

// Not found handler middleware
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    LoggerService.warn(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'NotFoundError',
        message: `Cannot ${req.method} ${req.path}`
    });
}; 