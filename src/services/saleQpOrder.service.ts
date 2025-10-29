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

interface SaleQpOrder {
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

interface CreateSaleQpOrderData {
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
}

interface BulkStatusUpdateData {
  orderIds: string[];
  status?: 'pending' | 'in_progress' | 'completed' | 'loading' | 'going_to_delivery' | 'delivered';
  deliveryStatus?: 'not_started' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';
  billPhotos?: Array<{
    url: string;
    filename?: string;
  }>;
}

interface StatusUpdateData {
  status?: 'pending' | 'in_progress' | 'completed' | 'loading' | 'going_to_delivery' | 'delivered';
  deliveryStatus?: 'not_started' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';
  billPhotos?: Array<{
    url: string;
    filename?: string;
  }>;
}

export const saleQpOrderService = {
  // Create Sale QP Order
  async createSaleQpOrder(data: CreateSaleQpOrderData): Promise<ApiResponse<SaleQpOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<SaleQpOrder>> = await Request.post(
        Endpoint.CREATE_SALE_QP_ORDER,
        data
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Create sale QP order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create sale QP order"
      );
    }
  },

  // Get All Sale QP Orders
  async getAllSaleQpOrders(filters): Promise<ApiResponse<SaleQpOrder[]>> {
    try {
      const response: AxiosResponse<ApiResponse<SaleQpOrder[]>> = await Request.post(
        Endpoint.GET_ALL_SALE_QP_ORDER, 
        filters
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get all sale QP orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch sale QP orders"
      );
    }
  },

  // Get Sale QP Orders By Staff ID
  async getSaleQpOrdersByStaffId(id: string): Promise<ApiResponse<SaleQpOrder[]>> {
    try {
      const response: AxiosResponse<ApiResponse<SaleQpOrder[]>> = await Request.get(
        `${Endpoint.GET_SALE_QP_ORDER_BY_STAFF_ID}/${id}`
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get sale QP orders by staff ID error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch sale QP orders by staff ID"
      );
    }
  },

  // Get Sale QP Order By ID
  // async getSaleQpOrderById(id: string): Promise<ApiResponse<SaleQpOrder>> {
  //   try {
  //     const token = authService.getToken();
  //     if (!token) {
  //       throw new Error("No authentication token found");
  //     }

  //     const response: AxiosResponse<ApiResponse<SaleQpOrder>> = await axios.get(
  //       `${Endpoint.GET_SALE_QP_ORDER_BY_ID}/${id}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //         withCredentials: true,
  //       }
  //     );

  //     return {
  //       success: response.data.success,
  //       data: response.data.data,
  //       message: response.data.message,
  //     };
  //   } catch (error: any) {
  //     console.error("Service: Get sale QP order by ID error:", error);
  //     throw new Error(error.response?.data?.message || "Failed to fetch sale QP order");
  //   }
  // },

  // Update Sale QP Order
  async updateSaleQpOrder(
    id: string,
    data: Partial<CreateSaleQpOrderData & {
      printerPapers?: PaperField[];
      binderPapers?: PaperField[];
      bookletPapers?: PaperField[];
    }>
  ): Promise<ApiResponse<SaleQpOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<SaleQpOrder>> = await Request.put(
        `${Endpoint.UPDATE_SALE_QP_ORDER}/${id}`,
        data
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Update sale QP order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update sale QP order"
      );
    }
  },

  // Driver Status Update for Sale QP Order
  async driverStatusUpdate(
    id: string,
    data: StatusUpdateData
  ): Promise<ApiResponse<SaleQpOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<SaleQpOrder>> = await Request.post(
        `${Endpoint.UPDATE_SALE_QP_ORDER_STATUS}/${id}/status`,
        data
      );
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Driver status update error for sale QP order:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update sale QP order status"
      );
    }
  },

  // Driver Bulk Status Update for Sale QP Orders (Multiple Orders)
  async driverBulkStatusUpdate(
    data: BulkStatusUpdateData
  ): Promise<ApiResponse<SaleQpOrder[]>> {
    try {
      console.log(data, 'service data for sale QP orders');
      const response: AxiosResponse<ApiResponse<SaleQpOrder[]>> = await Request.post(
        Endpoint.UPDATE_SALE_QP_ORDER_BULK_STATUS,
        data
      );
      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Driver bulk status update error for sale QP orders:", error);
      throw new Error(
        error.response?.data?.message || "Failed to bulk update sale QP order status"
      );
    }
  },

  // Delete Sale QP Order
  async deleteSaleQpOrder(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_SALE_QP_ORDER}/${id}`
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Delete sale QP order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete sale QP order"
      );
    }
  },

  // Remove Loading Sale QP Order
  async removeLoadingSaleQpOrder(orderId: string): Promise<ApiResponse<SaleQpOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<SaleQpOrder>> = await Request.post(
        Endpoint.REMOVE_LOADING_SALE_QP_ORDER,
        { orderId }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Remove loading sale QP order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to remove loading sale QP order"
      );
    }
  },

  // GET Designer Sale QP Orders
  // async getGodownSaleQpOrders(): Promise<ApiResponse<SaleQpOrder[]>> {
  //   try {
  //     const token = authService.getToken();
  //     if (!token) {
  //       throw new Error("No authentication token found");
  //     }

  //     const response: AxiosResponse<ApiResponse<SaleQpOrder[]>> = await axios.get(
  //       `${Endpoint.GET_DESIGNER_SALE_QP_ORDERS}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //         withCredentials: true,
  //       }
  //     );

  //     return {
  //       success: response.data.success,
  //       data: response.data.data || [],
  //       message: response.data.message,
  //     };
  //   } catch (error: any) {
  //     console.error("Service: Get designer sale QP orders error:", error);
  //     throw new Error(
  //       error.response?.data?.message || "Failed to fetch designer sale QP orders"
  //     );
  //   }
  // },
};