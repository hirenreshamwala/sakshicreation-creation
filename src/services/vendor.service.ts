import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

export interface Vendor {
  _id: string;
  companyName: string | { _id: string; companyName: string };
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  gst: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendor {
  companyName: string;
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  gst?: string;
  address: string;
}

export interface UpdateVendor {
  companyName?: string;
  name?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  gst?: string;
  address?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const vendorService = {
  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor[]>> = await axios.get(
        Endpoint.GET_ALL_VENDORS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch vendors'
      );
    }
  },

  async getVendorById(id: string): Promise<ApiResponse<Vendor>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor>> = await axios.get(
        `${Endpoint.GET_VENDOR_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch vendor'
      );
    }
  },

  async createVendor(data: CreateVendor): Promise<Vendor> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor>> = await axios.post(
        Endpoint.CREATE_VENDOR,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create vendor'
      );
    }
  },

  async updateVendor(id: string, data: Partial<UpdateVendor>): Promise<Vendor> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor>> = await axios.patch(
        `${Endpoint.UPDATE_VENDOR}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update vendor'
      );
    }
  },

  async deleteVendor(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${Endpoint.DELETE_VENDOR}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete vendor'
      );
    }
  },

  async bulkCreateVendors(formData: FormData): Promise<ApiResponse<Vendor[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor[]>> = await axios.post(
        Endpoint.BULK_CREATE_VENDORS,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to bulk create vendors'
      );
    }
  },
};