// services/vendor.service.ts

import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

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
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ADD THIS INTERFACE (for filters dropdown)
export interface VendorFiltersResponse {
  companyNames: string[];
  vendorNames: string[];
  contactNumbers: string[];
  whatsappNumbers: string[];
  gstNumbers: string[];
}

// THE REST OF YOUR SERVICE (only small changes + 1 new method)

export const vendorService = {
  // This already exists – keep it exactly like this (it accepts query string)
  async getVendors(query = '') {
    const res = await Request.get(`${Endpoint.GET_ALL_VENDORS}?${query}`);
    return res.data; // now returns { data: Vendor[], pagination: {...} }
  },

  // NEW METHOD – ADD THIS
  async getVendorFilters(): Promise<VendorFiltersResponse> {
    const response = await Request.get(Endpoint.GET_ALL_VENDORS_FILTERS);
    return response.data; // { companyNames: ["ABC Ltd", "XYZ Corp", ...] }
  },

  async getVendorById(id: string): Promise<ApiResponse<Vendor>> {
    try {
      const response: AxiosResponse<ApiResponse<Vendor>> = await Request.get(
        `${Endpoint.GET_VENDOR_BY_ID}/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vendor');
    }
  },

  async createVendor(data: CreateVendor): Promise<Vendor> {
    try {
      const response: AxiosResponse<ApiResponse<Vendor>> = await Request.post(
        Endpoint.CREATE_VENDOR,
        data
      );
      return response.data.data!; // populated vendor
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create vendor');
    }
  },

  async updateVendor(id: string, data: Partial<UpdateVendor>): Promise<Vendor> {
    try {
      const response: AxiosResponse<ApiResponse<Vendor>> = await Request.patch(
        `${Endpoint.UPDATE_VENDOR}/${id}`,
        data
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update vendor');
    }
  },

  async deleteVendor(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_VENDOR}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete vendor');
    }
  },

  async bulkCreateVendors(formData: FormData): Promise<ApiResponse<Vendor[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Vendor[]>> = await Request.post(
        Endpoint.BULK_CREATE_VENDORS,
        formData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk create vendors');
    }
  },
};