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


export const orderService = {
  // Create Order
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        Endpoint.CREATE_QP_ORDER,
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

  // Get All Orders
  async getAllOrders(filters): Promise<ApiResponse<Order[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.post(
        Endpoint.GET_ALL_QP_ORDER, filters
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
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

      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.get(
        `${Endpoint.GET_QP_ORDER_BY_STAFF_ID}/${id}`);

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
  //   async getOrderById(id: string): Promise<ApiResponse<Order>> {
  //     try {
  //       const token = authService.getToken();
  //       if (!token) {
  //         throw new Error("No authentication token found");
  //       }

  //       const response: AxiosResponse<ApiResponse<Order>> = await axios.get(
  //         `${Endpoint.GET_ORDER_BY_ID}/${id}`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //           },
  //           withCredentials: true,
  //         }
  //       );

  //       return {
  //         success: response.data.success,
  //         data: response.data.data,
  //         message: response.data.message,
  //       };
  //     } catch (error: any) {
  //       console.error("Service: Get order by ID error:", error);
  //       throw new Error(error.response?.data?.message || "Failed to fetch order");
  //     }
  //   },

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
        `${Endpoint.UPDATE_QP_ORDER}/${id}`,
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
  async driverStatusUpdate(
    id: string,
    data: StatusUpdateData
  ): Promise<ApiResponse<Order>> {
    try {
      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        `${Endpoint.UPDATE_QP_ORDER_STATUS}/${id}/status`,
        data
      );
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Driver status update error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  },

  // Driver Bulk Status Update (Multiple Orders)
  async driverBulkStatusUpdate(
    data: BulkStatusUpdateData
  ): Promise<ApiResponse<Order[]>> {
    try {
      console.log(data, 'service data')
      const response: AxiosResponse<ApiResponse<Order[]>> = await Request.post(
        Endpoint.UPDATE_QP_ORDER_BULK_STATUS,
        data
      );
      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Driver bulk status update error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to bulk update order status"
      );
    }
  },


  // Delete Order
  async deleteOrder(id: string): Promise<ApiResponse<null>> {
    try {

      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_QP_ORDER}/${id}`);

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

  async removeLoadingOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        Endpoint.REMOVE_LOADING_ORDER,
        { orderId }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Remove loading order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to remove loading order"
      );
    }
  },

  async sendBoxFromGodownOrFactory(
    id: string,
    data: Partial<CreateOrderData & {
      printerPapers?: PaperField[];
      binderPapers?: PaperField[];
      bookletPapers?: PaperField[];
    }>

  ): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        `${Endpoint.SEND_BOX_FROM_GODOWN_OR_FACTORY}/${id}`,
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
  async driverSelectAndManageInventory(
    id: string,
    data: any
  ): Promise<ApiResponse<Order>> {
    try {

      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        `${Endpoint.DRIVER_SELECT_AND_INVENTORY_MANAGE}/${id}`,
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
  }

  async markOrderAsUrgent(orderId: string, isUrgent: boolean): Promise<ApiResponse<Order>> {
    try {
      const response: AxiosResponse<ApiResponse<Order>> = await Request.post(
        `${Endpoint.MARK_ORDER_AS_URGENT}/${orderId}`,{ isUrgent }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Mark order as urgent error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to mark order as urgent"
      );
    }
  }


    //GET DESIGNER ORDER
    //   async getGodownOrders(): Promise<ApiResponse<Order[]>> {
    //     try {
    //       const token = authService.getToken();
    //       if (!token) {
    //         throw new Error("No authentication token found");
    //       }

    //       const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
    //         `${Endpoint.GET_DESIGNER_ORDERS}`,
    //         {
    //           headers: {
    //             Authorization: `Bearer ${token}`,
    //             "Content-Type": "application/json",
    //           },
    //           withCredentials: true,
    //         }
    //       );

    //       return {
    //         success: response.data.success,
    //         data: response.data.data || [],
    //         message: response.data.message,
    //       };
    //     } catch (error: any) {
    //       console.error("Service: Get designer orders error:", error);
    //       throw new Error(
    //         error.response?.data?.message || "Failed to fetch designer orders"
    //       );
    //     }
    //   },

  };
