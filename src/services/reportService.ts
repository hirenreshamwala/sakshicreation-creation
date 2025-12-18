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

export interface ProductItemReport {
  staffName: string;
  products: {
    productName: string;
    orderCount: number;
  }[];
}

export interface ProductItemsApiResponse {
  success: boolean;
  data: ProductItemReport[];
  message?: string;
}

interface StaffSCSalesData {
  _id: string;
  staffName: string;
  totalFinalAmount: number;
  totalOrders: number;
}

interface SalesCreditApiResponse {
  success: boolean;
  message: string;
  data: {
    report: StaffSCSalesData[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

interface OrderDetailQP {
  orderNumber: number;
  totalKg: string;
  createdAt: string;
}

interface StaffQPSalesData {
  _id: string;
  staffName: string;
  totalKgSum: number;
  totalOrders: number;
  createdBy: string;
  orders: OrderDetailQP[];
}

interface QPSalesCreditApiResponse {
  success: boolean;
  message: string;
  data: {
    report: StaffQPSalesData[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
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

  async getProductItemsReport(data: DateRange): Promise<ProductItemsApiResponse> {
    try {
      const response: AxiosResponse<ProductItemsApiResponse> = await Request.post(
        Endpoint.GET_SC_PRODUCT_ITEM,  // niche endpoint add karvani che
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch product items report");
    }
  },

  async getSalesCreditReport(data: DateRange): Promise<SalesCreditApiResponse> {
  try {
    const response: AxiosResponse<SalesCreditApiResponse> = await Request.post(
      Endpoint.GET_SALES_CREDIT_REPORT, // tame endpoint define karvani
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch sales credit report");
  }
},
async getQPSalesCreditReport(data: DateRange): Promise<QPSalesCreditApiResponse> {
  try {
    const response: AxiosResponse<QPSalesCreditApiResponse> = await Request.post(
      Endpoint.GET_QP_SALES_CREDIT_REPORT,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch QP sales credit report");
  }
}

};