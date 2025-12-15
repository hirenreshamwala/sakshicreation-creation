import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

export interface DesignerPerformance {
  designerId: string;
  name: string;
  firstName: string;
  lastName: string;
  totalOrders: number;
  approved: number;
  newDesigns: number;
  rework: number;
  pending: number;
  inProgress: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface PrinterPerformance {
  printerId: string;
  name: string;
  firstName: string;
  lastName: string;
  totalAssignedOrders: number;
  printingCompletedCount: number;
  pendingOrdersCount: number;
  inProgressOrdersCount: number;
  completionRate: string;
  avgCompletionDays: string;
  avgPendingDays: string;
  avgInProgressDays: string;
  performanceMetrics: {
    totalOrders: number;
    completed: number;
    pending: number;
    inProgress: number;
    efficiency: string;
    avgProcessingTime: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface BinderPerformance {
  binderId: string;
  name: string;
  firstName: string;
  lastName: string;
  totalAssignedOrders: number;
  bindingCompletedCount: number;
  pendingOrdersCount: number;
  inProgressOrdersCount: number;
  completionRate: string;
  avgCompletionDays: string;
  performanceMetrics: {
    totalOrders: number;
    completed: number;
    pending: number;
    inProgress: number;
    efficiency: string;
    avgProcessingTime: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface BookletBinderPerformance {
  bookletBinderId: string;
  name: string;
  firstName: string;
  lastName: string;
  totalAssignedOrders: number;
  bookletBindingCompletedCount: number;
  pendingOrdersCount: number;
  inProgressOrdersCount: number;
  completionRate: string;
  avgCompletionDays: string;
  performanceMetrics: {
    totalOrders: number;
    completed: number;
    pending: number;
    inProgress: number;
    efficiency: string;
    avgProcessingTime: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  overallStats?: any;
  message?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const reportService = {
  async getDesignerPerformance(data: DateRange): Promise<ApiResponse<DesignerPerformance>> {
    try {
      const response: AxiosResponse<ApiResponse<DesignerPerformance>> = await Request.post(
        Endpoint.GET_SC_DESIGNERS,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch designer performance data");
    }
  },

  async getPrinterPerformance(data: DateRange): Promise<ApiResponse<PrinterPerformance>> {
    try {
      const response: AxiosResponse<ApiResponse<PrinterPerformance>> = await Request.post(
        Endpoint.GET_SC_PRINTERS,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch printer performance data");
    }
  },

  async getBinderPerformance(data: DateRange): Promise<ApiResponse<BinderPerformance>> {
    try {
      const response: AxiosResponse<ApiResponse<BinderPerformance>> = await Request.post(
        Endpoint.GET_SC_BINDER,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch binder performance data");
    }
  },

  async getBookletBinderPerformance(data: DateRange): Promise<ApiResponse<BookletBinderPerformance>> {
    try {
      const response: AxiosResponse<ApiResponse<BookletBinderPerformance>> = await Request.post(
        Endpoint.GET_SC_BOOKLET_BINDER,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch booklet binder performance data");
    }
  },
};