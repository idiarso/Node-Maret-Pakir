import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface Vehicle {
  id: number;
  plate_number: string;
  type: 'MOTOR' | 'MOBIL';
}

interface ParkingSession {
  id: number;
  vehicle: Vehicle;
  entry_time: string;
  exit_time?: string;
  status: 'ACTIVE' | 'EXITED';
}

interface CreateParkingSessionRequest {
  vehicle_id: number;
  entry_time: string;
}

interface ExitParkingSessionRequest {
  session_id: number;
  exit_time: string;
  parking_fee: number;
}

const parkingSessionService = {
  getAll: async (): Promise<ParkingSession[]> => {
    const response = await axios.get<ParkingSession[]>(`${API_BASE_URL}/parking-sessions`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  getSession: async (code: string): Promise<ParkingSession> => {
    const response = await axios.get<ParkingSession>(`${API_BASE_URL}/parking-sessions/code/${code}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  createEntry: async (data: CreateParkingSessionRequest): Promise<ParkingSession> => {
    const response = await axios.post<ParkingSession>(`${API_BASE_URL}/parking-sessions/entry`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  update: async (id: number, data: Partial<ParkingSession>): Promise<ParkingSession> => {
    const response = await axios.put<ParkingSession>(`${API_BASE_URL}/parking-sessions/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  processExit: async (data: ExitParkingSessionRequest): Promise<ParkingSession> => {
    const response = await axios.post<ParkingSession>(`${API_BASE_URL}/parking-sessions/exit`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  sendCommand: async (gateId: number, command: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/gates/${gateId}/command`, { command }, {
      headers: getAuthHeader()
    });
  },

  printExitTicket: async (sessionId: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/parking-sessions/${sessionId}/print-exit`, null, {
      headers: getAuthHeader()
    });
  },

  captureExitPhoto: async (sessionId: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/parking-sessions/${sessionId}/capture-exit`, null, {
      headers: getAuthHeader()
    });
  }
};

export default parkingSessionService; 