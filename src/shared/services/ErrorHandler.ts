import { Response } from 'express';
import { Logger } from './Logger';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private logger: Logger;

    private constructor() {
        this.logger = Logger.getInstance();
    }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    public handleError(error: Error | AppError, res: Response): void {
        if (error instanceof AppError) {
            this.handleOperationalError(error, res);
        } else {
            this.handleProgrammingError(error, res);
        }
    }

    private handleOperationalError(error: AppError, res: Response): void {
        this.logger.error(error.message, {
            statusCode: error.statusCode,
            stack: error.stack
        });

        res.status(error.statusCode).json({
            status: 'error',
            message: error.message
        });
    }

    private handleProgrammingError(error: Error, res: Response): void {
        this.logger.error('Programming Error:', {
            message: error.message,
            stack: error.stack
        });

        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
} 