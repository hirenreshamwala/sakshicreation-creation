import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';
import Request from './axios';

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
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await Request.get(
        `${Endpoint.GET_BY_CATEGORY}/${category}`);
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
      const response: AxiosResponse<ApiResponse<{ lastPurchase: number, usedQty: number, balance: number }>> = await Request.get(
        `${Endpoint.GET_CATEGORY}/${category}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory summary'
      );
    }
  },

  
};