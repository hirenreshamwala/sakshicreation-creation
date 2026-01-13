import { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";


interface PaperField {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
}
interface Order {
  _id: string;
  companyName: any;
  party: any;
  productItem: any;
  qty: number;
  remarks: string;
  filePaths: string[];
  status: string;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
  printerPapers?: PaperField[];
  binderPapers?: PaperField[];
  bookletPapers?: PaperField[];

}

interface CreateOrderData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  filePaths?: string[];
  createdBy?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  count?: number;
}

export const orderService = {
  // Create Order
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        Endpoint.CREATE_ORDER,
        data);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Create order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create order"
      );
    }
  },

  async getAllOrders(filters): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.post(
        Endpoint.GET_ALL_ORDERS,filters
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        count: response.data.count,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Service: Get all orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  },
  async getAllPaginationOrders(filters): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.post(
        Endpoint.GET_ALL_ORDERS_PAGINATION, filters
      );
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          count: response.data.totalCount, // FIXED: Use totalCount as count
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: false,
          message: response.data.message,
        };
      }
    } catch (error: any) {
      console.error("Service: Get all orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  },

  // FIXED: getOrdersByStaffId now accepts filters and returns count/pagination
  async getOrdersByStaffId(id: string, filters: any): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.post(
        `${Endpoint.GET_ORDER_BY_STAFF_ID}/${id}`,
        filters
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        count: response.data.totalCount, // FIXED: Add count
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Service: Get orders by staff ID error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders by staff ID"
      );
    }
  },


  // Get Order By ID
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.get(
        `${Endpoint.GET_ORDER_BY_ID}/${id}`);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get order by ID error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch order");
    }
  },

  // Update Order
  async updateOrder(
    id: string,
    data: Partial<CreateOrderData & {
      printerPapers?: PaperField[];
      binderPapers?: PaperField[];
      bookletPapers?: PaperField[];
    }>

  ): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.put(
        `${Endpoint.UPDATE_ORDER}/${id}`,
        data);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Update order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update order"
      );
    }
  },

  // Delete Order
  async deleteOrder(id: string): Promise<ApiResponse<null>> {
    try {

      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_ORDER}/${id}`);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Delete order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete order"
      );
    }
  },

  // Get Orders by Company and Party
  async getOrdersByCompanyAndParty(
    companyId: string,
    partyId: string
  ): Promise<ApiResponse<Order[]>> {
    try {

      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        `${Endpoint.GET_ORDERS_BY_COMPANY_PARTY}/company/${companyId}/party/${partyId}`);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get orders by company and party error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  },

  //GET DESIGNER ORDER
  async getDesignerOrders(): Promise<ApiResponse<Order[]>> {
    try {

      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        `${Endpoint.GET_DESIGNER_ORDERS}`);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },

  //GET PRINTER ORDER
  async getPrinterOrders(): Promise<ApiResponse<Order[]>> {
    try {

      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        `${Endpoint.GET_PRINTER_ORDERS}`);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },
  async searchFilterOptions(field: string, search: string = "", filters: any = {}): Promise<ApiResponse<string[]>> {
    try {
      const response: AxiosResponse<ApiResponse<string[]>> = await Request.post(
        `${Endpoint.GET_ORDER_FILTER_OPTIONS}/${field}`,
        { search, ...filters }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching ${field} filter options:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch filter options");
    }
  },


  //GET BINDER ORDER
  async getBinderOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        `${Endpoint.GET_PRINTER_BINDER}`);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },

  //GET BOOKLET BINDER
  async getBookletBinder(): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        `${Endpoint.GET_BOOKLET_BINDER}`);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },
  async exportOrdersToExcel(filters): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await Request.post(
        Endpoint.EXPORT_ORDERS_EXCEL,
        filters,
        {
          responseType: 'blob' // Important for file downloads
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to export account masters");
    }
  },
};
