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
  },
  async exportDesignerToExcel(data: DateRange) {
    try {
      const response = await Request.post(
        Endpoint.GET_SC_DESIGNERS_EXPORT,
        data,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data instanceof Blob
          ? await error.response.data.text()
          : error.response?.data?.message || 'Failed to export Excel';

      console.error('Excel export error:', errorMessage);
      throw new Error(errorMessage || 'Failed to export designer report to Excel');
    }
  },
  async exportPrinterToExcel(data: any) {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_PRINTER_EXCEL,
        data,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to export printer report');
    }
  },
  async exportBinderToExcel(data: any) {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_BINDER_EXCEL, // config માં ઉમેરો
        data,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to export binder report');
    }
  },

  async exportBookletBinderToExcel(data: any) {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_BOOKLETBINDER_EXCEL,
        data,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to export booklet binder report');
    }
  },

  async exportComplainToExcel(data: any) {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_COMPLAIN_EXCEL,
        data,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to export complain report');
    }
  },

  async exportPaymentFolderToExcel(data: any): Promise<Blob> {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_PAYMENT_FOLDER_EXCEL,
        data,
        { responseType: 'blob', timeout: 300000 }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export payment folders');
    }
  },

  async exportPaymentFolderDifffernceToExcel(data: any): Promise<Blob> {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_PAYMENT_FOLDER_DIFFERENCE_EXCEL,
        data,
        { responseType: 'blob', timeout: 300000 }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export payment folders');
    }
  },

  async exportPendingClientApprovalOrders(data: any): Promise<Blob | { empty: boolean; message: string }> {
    try {
      const response = await Request.post(
        Endpoint.EXPORT_PENDING_CLIENT_APPROVAL_ORDERS,
        data,
        { responseType: 'blob', timeout: 300000 }
      );

      // Check if response is JSON (empty case)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Try to parse as JSON
        try {
          const text = await response.data.text();
          const jsonResponse = JSON.parse(text);
          return jsonResponse; // Return JSON response for empty case
        } catch (e) {
          throw new Error('Failed to parse empty response');
        }
      }

      return response.data as Blob;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export pending client approval orders');
    }
  },

};