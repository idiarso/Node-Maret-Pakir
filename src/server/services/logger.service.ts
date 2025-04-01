import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define log transports
const transports = [
    // Console transport
    new winston.transports.Console(),
    
    // Error log file transport
    new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
    }),
    
    // Combined log file transport
    new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
    }),
];

// Create the logger
const Logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

export class LoggerService {
    static error(message: string, meta?: any) {
        Logger.error(message + (meta ? ` ${JSON.stringify(meta)}` : ''));
    }

    static warn(message: string, meta?: any) {
        Logger.warn(message + (meta ? ` ${JSON.stringify(meta)}` : ''));
    }

    static info(message: string, meta?: any) {
        Logger.info(message + (meta ? ` ${JSON.stringify(meta)}` : ''));
    }

    static http(message: string, meta?: any) {
        Logger.http(message + (meta ? ` ${JSON.stringify(meta)}` : ''));
    }

    static debug(message: string, meta?: any) {
        Logger.debug(message + (meta ? ` ${JSON.stringify(meta)}` : ''));
    }
} 