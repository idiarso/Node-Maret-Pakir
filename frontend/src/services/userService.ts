import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'cashier';
  status: 'active' | 'inactive';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: 'admin' | 'operator' | 'cashier';
}

export interface UpdateUserDto {
  email?: string;
  full_name?: string;
  password?: string;
  role?: 'admin' | 'operator' | 'cashier';
  status?: 'active' | 'inactive';
}

const userService = {
  async getUsers(): Promise<User[]> {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  },

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users`, data);
    return response.data;
  },

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/users/${id}`);
  },

  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
  },

  async toggleUserStatus(id: number): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users/${id}/toggle-status`);
    return response.data;
  },
};

export default userService; 