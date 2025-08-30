import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";

export interface Inventory {
  _id: string;
  category: string;
  type: 'inward' | 'outward';
  material: any;
  quantity: number;
  kg: number;
  vendor: any;
  date: string;
  purchase?: string;
  companyName: any;
  for: any;
  forCompany: any;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const inventoryService = {
  async getInventoryByCategory(category: string): Promise<ApiResponse<Inventory[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await axios.get(
        `${Endpoint.GET_BY_CATEGORY}/${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory by category'
      );
    }
  },

  async getInventorySummary(category: string): Promise<ApiResponse<{ lastPurchase: number, usedQty: number, balance: number }>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<{ lastPurchase: number, usedQty: number, balance: number }>> = await axios.get(
        `${Endpoint.GET_CATEGORY}/${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory summary'
      );
    }
  },

  
};