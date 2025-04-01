import axios from 'axios';
import { Payment, PaymentFormData, Ticket } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Payment API functions
export const getPayments = async (): Promise<Payment[]> => {
  const response = await api.get('/payments');
  return response.data;
};

export const createPayment = async (data: PaymentFormData): Promise<Payment> => {
  const response = await api.post('/payments', data);
  return response.data;
};

// Ticket API functions
export const getTickets = async (): Promise<Ticket[]> => {
  const response = await api.get('/tickets');
  return response.data;
};

export const getTicketById = async (id: string): Promise<Ticket> => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const updateTicket = async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
  const response = await api.patch(`/tickets/${id}`, data);
  return response.data;
};

export const getPaymentById = async (id: string) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export default api; 