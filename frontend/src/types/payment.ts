export type PaymentMethod = 'cash' | 'card' | 'e-wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Payment {
  id: string;
  ticketId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  ticketId: string;
  amount: number;
  paymentMethod: PaymentMethod;
} 