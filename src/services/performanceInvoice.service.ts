import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

export interface PerformanceInvoice {
  _id: string;
  orderNumber: string;
  companyName: string;
  partyName: string;
  pType: string;
  remarks: string;
  unitPrice: number;
  party: {
    _id: string;
    GSTNo?: string;
    address?: {
      unitNo?: string;
      streetAddress?: string;
      marketName?: string;
      landMark?: string;
      area?: string;
      pincode?: string;
    };
  };
  quantity: number;
  color?: string;
  size?: string;
  GSTNo?: string;
  partyAddress?: {
    unitNo?: string;
    streetAddress?: string;
    marketName?: string;
    landMark?: string;
    area?: string;
    pincode?: string;
  };
  assignedTo?: string | {
    _id: string;
    firstName: string;
    lastName: string;
  };
  ownerMobileNo: string;
  total: number;
  applyGST: boolean;
  finalAmount: number;
  servicePerformance: string;
  createdAt: string;
  updatedAt: string;
  daysAfterConfirmation?: number;
}

export interface CreatePerformanceInvoice {
  orderNumber: string;
  companyName: string;
  partyName: string;
  quantity: number;
  color?: string;
  size?: string;
  GSTNo?: string;
  partyAddress?: {
    unitNo?: string;
    streetAddress?: string;
    marketName?: string;
    landMark?: string;
    area?: string;
    pincode?: string;
  };
  assignedTo?: string;
  servicePerformance: string;
  daysAfterConfirmation?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  companyName: {
    _id: string;
    name: string;
  };
  party: {
    _id: string;
    partyName: string;
    GSTNo?: string;
    address?: {
      unitNo?: string;
      streetAddress?: string;
      marketName?: string;
      landMark?: string;
      area?: string;
      pincode?: string;
    };
  };
  productItem: {
    _id: string;
    itemName: string;
    color?: string;
    size?: string;
  };
  qty: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const performanceInvoiceService = {
  async getPerformanceInvoices(): Promise<ApiResponse<PerformanceInvoice[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PerformanceInvoice[]>> = await Request.get(
        Endpoint.GET_ALL_PERFORMANCE_INVOICES);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch performance invoices");
    }
  },

  async getPerformanceInvoiceById(id: string): Promise<ApiResponse<PerformanceInvoice>> {
    try {
      const response: AxiosResponse<ApiResponse<PerformanceInvoice>> = await Request.get(
        `${Endpoint.GET_PERFORMANCE_INVOICE_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch performance invoice");
    }
  },

  async createPerformanceInvoice(data: CreatePerformanceInvoice): Promise<PerformanceInvoice> {
    try {
      const response: AxiosResponse<PerformanceInvoice> = await Request.post(
        Endpoint.CREATE_PERFORMANCE_INVOICE,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create performance invoice");
    }
  },

  async updatePerformanceInvoice(id: string, data: Partial<CreatePerformanceInvoice>): Promise<PerformanceInvoice> {
    try {
      const response: AxiosResponse<PerformanceInvoice> = await Request.patch(
        `${Endpoint.UPDATE_PERFORMANCE_INVOICE}/${id}`,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update performance invoice");
    }
  },

  async deletePerformanceInvoice(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_PERFORMANCE_INVOICE}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete performance invoice");
    }
  },

  async getAllOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        Endpoint.GET_ALL_ORDERS);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch orders");
    }
  },

  async getOrderByOrderNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.get(
        `${Endpoint.GET_ORDER_BY_ORDER_NUMBER}/${orderNumber}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch order");
    }
  },
};