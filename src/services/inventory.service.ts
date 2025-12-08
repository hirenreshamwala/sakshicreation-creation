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
  totalCount?: number;
  pagination?: any;
}

export const inventoryService = {
  async getInventoryByCategory(params: { category: string; type?: string; page?: number; pageSize?: number; isPagination?: boolean }): Promise<ApiResponse<Inventory[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await Request.post(
        `${Endpoint.GET_BY_CATEGORY}/${params.category}`,
        params // Send params in body for POST
      );
      return {
        success: response.data.success,
        data: response.data.data || [],
        totalCount: response.data.totalCount,
        pagination: response.data.pagination,
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory by category');
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
  async getAllInventoryForQuality(params?: any): Promise<ApiResponse<Inventory[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await Request.post(
        Endpoint.GET_ALL_INVENTORY_FOR_QUALITY,
        params || {}
      );
      return {
        success: response.data.success,
        data: response.data.data || [],
        totalCount: response.data.totalCount,
        pagination: response.data.pagination,
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch inventory');
    }
  },

  // Added: For filter options
  async searchFilterOptions(field: string, searchTerm: string, filters?: any): Promise<ApiResponse<string[]>> {
    try {
      const response: AxiosResponse<ApiResponse<string[]>> = await Request.post(
        `${Endpoint.GET_INVENTORY_FILTER_OPTIONS}/${field}`,
        { search: searchTerm, ...filters }
      );
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || `Failed to search ${field} options`);
    }
  },
  async getInventoryBoxSummery(data: any): Promise<ApiResponse<Inventory[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await Request.post(
        Endpoint.GET_INVENTORY_BOX,data);
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