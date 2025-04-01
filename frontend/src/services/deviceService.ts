import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Device {
  id: number;
  device_name: string;
  device_type: 'entry_gate' | 'exit_gate' | 'payment_kiosk';
  location: string;
  ip_address: string;
  port: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_online: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceDto {
  device_name: string;
  device_type: 'entry_gate' | 'exit_gate' | 'payment_kiosk';
  location: string;
  ip_address: string;
  port: string;
}

export interface UpdateDeviceDto {
  device_name?: string;
  device_type?: 'entry_gate' | 'exit_gate' | 'payment_kiosk';
  location?: string;
  ip_address?: string;
  port?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

const deviceService = {
  async getDevices(): Promise<Device[]> {
    const response = await axios.get<Device[]>(`${API_BASE_URL}/devices`);
    return response.data;
  },

  async getDevice(id: number): Promise<Device> {
    const response = await axios.get<Device>(`${API_BASE_URL}/devices/${id}`);
    return response.data;
  },

  async createDevice(data: CreateDeviceDto): Promise<Device> {
    const response = await axios.post<Device>(`${API_BASE_URL}/devices`, data);
    return response.data;
  },

  async updateDevice(id: number, data: UpdateDeviceDto): Promise<Device> {
    const response = await axios.put<Device>(`${API_BASE_URL}/devices/${id}`, data);
    return response.data;
  },

  async deleteDevice(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/devices/${id}`);
  },

  async testConnection(id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${API_BASE_URL}/devices/${id}/test`
    );
    return response.data;
  },

  async restartDevice(id: number): Promise<{ success: boolean; message: string }> {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${API_BASE_URL}/devices/${id}/restart`
    );
    return response.data;
  },

  async getDeviceStatus(id: number): Promise<{
    status: 'active' | 'inactive' | 'maintenance';
    last_online: string | null;
    details: {
      cpu_usage?: number;
      memory_usage?: number;
      temperature?: number;
      uptime?: number;
    };
  }> {
    const response = await axios.get<{
      status: 'active' | 'inactive' | 'maintenance';
      last_online: string | null;
      details: {
        cpu_usage?: number;
        memory_usage?: number;
        temperature?: number;
        uptime?: number;
      };
    }>(`${API_BASE_URL}/devices/${id}/status`);
    return response.data;
  },
};

export default deviceService; 