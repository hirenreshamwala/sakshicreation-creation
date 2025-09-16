import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';
const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
export interface CompanyName {
  _id: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  _id: string;
  roleName: string;
  isDelete: boolean;
  totalUser: number;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  role: string | Role;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  _id: string;
  materialName: string;
  materialSize: string;
  materialGSM: number;
  createdAt: string;
  updatedAt: string;
}
export interface Vendor {
  _id: string;
  name: string;
}

export interface Purchase {
  _id: string;
  vendorName: string | Vendor;
  billNumber: string;
  material: Material;
  quantity: number;
  ratePerSheet: number;
  kg: number;
  companyName: CompanyName;
  for: Role;
  forCompany: Staff | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchase {
  vendorName: string;
  billNumber: string;
  material: string;
  quantity: number;
  ratePerSheet: number;
  kg: number;
  companyName: string;
  for: string;
  forCompany: string;
}

export interface UpdatePurchase {
  vendorName?: string;
  billNumber?: string;
  material?: string;
  quantity?: number;
  ratePerSheet?: number;
  kg?: number;
  companyName?: string;
  for?: string;
  forCompany?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const purchaseService = {
  async getCompanies(): Promise<ApiResponse<CompanyName[]>> {
    try {
      const response: AxiosResponse<ApiResponse<CompanyName[]>> = await Request.get(
        Endpoint.COMPANY_NAME_GET_ALL);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch companies'
      );
    }
  },

  async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Role[]>> = await Request.get(
        Endpoint.GET_ALL_ROLES);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch roles'
      );
    }
  },

  async getStaffByRole(roleId: string): Promise<ApiResponse<Staff[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Staff[]>> = await Request.get(
        `${BaseURL}/api/purchase/getstaffbyrole/${roleId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch staff by role'
      );
    }
  },

  async getPurchases(): Promise<ApiResponse<Purchase[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.get(
        Endpoint.GET_ALL_PURCHASES);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch purchases'
      );
    }
  },

  async getPurchaseById(id: string): Promise<ApiResponse<Purchase>> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase>> = await Request.get(
        `${Endpoint.GET_PURCHASE_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch purchase'
      );
    }
  },

  async createPurchase(data: CreatePurchase): Promise<Purchase> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase>> = await Request.post(
        Endpoint.CREATE_PURCHASE,
        data);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create purchase'
      );
    }
  },

  async updatePurchase(id: string, data: Partial<UpdatePurchase>): Promise<Purchase> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase>> = await Request.patch(
        `${Endpoint.UPDATE_PURCHASE}/${id}`,
        data);
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update purchase'
      );
    }
  },

  async deletePurchase(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_PURCHASE}/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete purchase'
      );
    }
  },

  async getPurchasesByMaterial(materialId: string): Promise<ApiResponse<Purchase[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.get(
        `${Endpoint.GET_PURCHASES_BY_MATERIAL}/${materialId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch purchases by material'
      );
    }
  },

  async getPurchasesByCompany(companyId: string): Promise<ApiResponse<Purchase[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.get(
        `${Endpoint.GET_PURCHASES_BY_COMPANY}/${companyId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch purchases by company'
      );
    }
  },

  async getPurchasesByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Purchase[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.get(
        Endpoint.GET_PURCHASES_BY_DATE_RANGE,
        { params: { startDate, endDate } }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch purchases by date range'
      );
    }
  },

  async bulkCreatePurchases(formData: FormData): Promise<ApiResponse<Purchase[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.post(
        Endpoint.BULK_CREATE_PURCHASES,
        formData);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to upload purchases'
      );
    }
  },
};