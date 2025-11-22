import Endpoint from '@/API/apiConfig';
import { AxiosResponse } from 'axios';
import Request from './axios';
export interface LowStock {
  id: string;
  deckal: string;
  gsm: string;
  bf: string;
  color: string;
  minKg: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLowStock {
  deckal: string;
  gsm: string;
  bf: string;
  color: string;
  minKg: number;
}

export interface UpdateLowStock {
  deckal?: string;
  gsm?: string;
  bf?: string;
  color?: string;
  minKg?: number;
}

export interface LowStockStatus extends LowStock {
  availableKg: number;
  isLowStock: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const lowStockService = {
  async getLowStocks(): Promise<ApiResponse<LowStock[]>> {
    try {
      const response: AxiosResponse<ApiResponse<LowStock[]>> = 
        await Request.get(Endpoint.GETALLOWSTOCKS);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch low stocks');
    }
  },

  async getLowStockById(id: string): Promise<ApiResponse<LowStock>> {
    try {
      const response: AxiosResponse<ApiResponse<LowStock>> = 
        await Request.get(Endpoint.GETLOWSTOCKBYID(id));
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch low stock');
    }
  },

  async createLowStock(data: CreateLowStock): Promise<LowStock> {
    try {
      const response: AxiosResponse<ApiResponse<LowStock>> = 
        await Request.post(Endpoint.CREATELOWSTOCK, data);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create low stock');
    }
  },

  async updateLowStock(id: string, data: Partial<UpdateLowStock>): Promise<LowStock> {
    try {
      const response: AxiosResponse<ApiResponse<LowStock>> = 
        await Request.patch(Endpoint.UPDATELOWSTOCK(id), data);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update low stock');
    }
  },

  async deleteLowStock(id: string): Promise<void> {
    try {
      await Request.delete(Endpoint.DELETELOWSTOCK(id));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete low stock');
    }
  },

  async checkLowStockStatus(): Promise<ApiResponse<LowStockStatus[]>> {
    try {
      const response: AxiosResponse<ApiResponse<LowStockStatus[]>> = 
        await Request.get(Endpoint.CHECKLOWSTOCKSTATUS);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check low stock status');
    }
  },
};
