import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/services/ErrorHandler';
import { Logger } from '../../shared/services/Logger';

export const validate = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const logger = Logger.getInstance();
        
        try {
            const { error } = schema.validate(req.body, {
                abortEarly: false,
                allowUnknown: true
            });

            if (error) {
                const errorMessages = error.details.map((detail: any) => detail.message);
                logger.warn(`Validation failed: ${errorMessages.join(', ')}`);
                throw new AppError(400, 'Validation failed', errorMessages);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const schemas = {
    login: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),

    createUser: Joi.object({
        username: Joi.string().required().min(3).max(30),
        password: Joi.string().required().min(6),
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('ADMIN', 'OPERATOR', 'SUPERVISOR').required()
    }),

    createTicket: Joi.object({
        plateNumber: Joi.string().required(),
        vehicleTypeId: Joi.number().required(),
        notes: Joi.string().allow('', null)
    }),

    createPayment: Joi.object({
        ticketId: Joi.number().required(),
        amount: Joi.number().required().min(0),
        paymentMethod: Joi.string().valid('CASH', 'CARD', 'E_WALLET', 'TRANSFER').required(),
        notes: Joi.string().allow('', null)
    }),

    createVehicleType: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('', null),
        price: Joi.number().required().min(0)
    })
}; 