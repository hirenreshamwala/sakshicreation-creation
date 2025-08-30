import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";


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
}

export const orderService = {
  // Create Order
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order>> = await axios.post(
        Endpoint.CREATE_ORDER,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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

  // Get All Orders
  async getAllOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    companyName?: string;
    party?: string;
    search?: string;
  }): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;
      if (params?.companyName) queryParams.companyName = params.companyName;
      if (params?.party) queryParams.party = params.party;
      if (params?.search) queryParams.search = params.search;

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        Endpoint.GET_ALL_ORDERS,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: queryParams,
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Service: Get all orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  },
  // Add this method to your orderService in order.service.ts
  async getOrdersByStaffId(id: string): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_ORDER_BY_STAFF_ID}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order>> = await axios.get(
        `${Endpoint.GET_ORDER_BY_ID}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order>> = await axios.put(
        `${Endpoint.UPDATE_ORDER}/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(
        `${Endpoint.DELETE_ORDER}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_ORDERS_BY_COMPANY_PARTY}/company/${companyId}/party/${partyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_DESIGNER_ORDERS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_PRINTER_ORDERS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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


  //GET BINDER ORDER
  async getBinderOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_PRINTER_BINDER}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_BOOKLET_BINDER}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

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
};
