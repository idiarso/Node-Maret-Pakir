// Gate interface
export interface Gate {
  id: number;
  name: string;
  location?: string;
  deviceId?: number;
  status: string;
  lastStatusChange?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  _optimistic?: boolean;
  _error?: string;
} 