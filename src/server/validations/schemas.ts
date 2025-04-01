import Joi from 'joi';

export const schemas = {
    createTicket: Joi.object({
        plateNumber: Joi.string().required().min(3).max(20),
        vehicleTypeId: Joi.number().required().positive(),
        notes: Joi.string().max(500).allow('', null)
    }),

    createPayment: Joi.object({
        ticketId: Joi.number().required().positive(),
        amount: Joi.number().required().min(0),
        paymentMethod: Joi.string().required().valid('CASH', 'CARD', 'E-WALLET'),
        notes: Joi.string().max(500).allow('', null)
    }),

    getTicketsByDateRange: Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required().min(Joi.ref('startDate'))
    })
}; 