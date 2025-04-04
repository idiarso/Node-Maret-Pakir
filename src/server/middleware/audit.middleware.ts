import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { AuditLog } from '../entities/AuditLog';
import { Logger } from '../../shared/services/ErrorHandler';

export const auditLog = (action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const logger = Logger.getInstance();
        const auditLogRepository = AppDataSource.getRepository(AuditLog);

        try {
            if (req.user) {
                const auditLog = auditLogRepository.create({
                    userId: req.user.id,
                    action,
                    details: {
                        method: req.method,
                        path: req.path,
                        body: req.body,
                        params: req.params,
                        query: req.query
                    }
                });

                await auditLogRepository.save(auditLog);
                logger.info(`Audit log created for action: ${action}`);
            }

            next();
        } catch (error) {
            logger.error('Error creating audit log:', error);
            next(error);
        }
    };
}; 