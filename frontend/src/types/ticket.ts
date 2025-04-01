export interface Ticket {
  id: string;
  plateNumber: string;
  entryTime: Date;
  exitTime?: Date;
  fee?: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
} 