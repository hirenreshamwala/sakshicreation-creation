import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { Role } from './role.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export const authService = {
  getToken: () => {
    return localStorage.getItem('auth_token');
  },
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },
  clearToken: () => {
    localStorage.removeItem('auth_token');
  },
  getUser: (): User | null => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
  fetchUser: async (token: string, userId: string): Promise<User> => {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = await axios.get(
        `${Endpoint.GET_USER_PROFILE}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        const { data } = response.data;
        return {
          id: data._id, // Map _id to id
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
        };
      }
      throw new Error('Failed to fetch user data');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user data');
    }
  },
};