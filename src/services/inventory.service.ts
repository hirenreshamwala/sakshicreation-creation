import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface Inventory {
  _id: string;
  category: string;
  type: 'inward' | 'outward';
  material: any;
  quantity: number;
  kg: number;
  usedKg?: number;
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
      const response: AxiosResponse<ApiResponse<{ lastPurchase: number, usedQty: number, balance: number }>> = await Request.get(
        `${Endpoint.GET_CATEGORY}/${category}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory summary'
      );
    }
  },

  async getAllInventory(): Promise<ApiResponse<Inventory[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await Request.get(
        Endpoint.GET_ALL_INVENTORY);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory'
      );
    }
  },

  // NEW: Update inventory item service
  async updateInventoryItem(id: string, updateData: Partial<Inventory>): Promise<ApiResponse<Inventory>> {
    try {
      const response: AxiosResponse<ApiResponse<Inventory>> = await Request.put(
        `${Endpoint.UPDATE_INVENTORY}/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update inventory item'
      );
    }
  },
};