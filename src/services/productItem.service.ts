import { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

interface ProductItem {
  _id: string;
  itemName: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateProductItemData {
  itemName: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  totalCount?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const productItemService = {
  // Create Product Item
  async createProductItem(data: CreateProductItemData): Promise<ApiResponse<ProductItem>> {
    try {
      const response: AxiosResponse<ApiResponse<ProductItem>> = await Request.post(
        Endpoint.CREATE_PRODUCT_ITEM,
        data);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Create Product Item Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to create product item");
    }
  },

  // Get All Product Items
  async getAllProductItems(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<ProductItem[]>> {
    try {

      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;

      const response: AxiosResponse<ApiResponse<ProductItem[]>> = await Request.get(
        Endpoint.GET_ALL_PRODUCT_ITEM,
        {params: queryParams}
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        totalCount: response.data.totalCount,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Get All Product Items Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch product items");
    }
  },

  // Get Product Item By ID
  async getProductItemById(id: string): Promise<ApiResponse<ProductItem>> {
    try {
      const response: AxiosResponse<ApiResponse<ProductItem>> = await Request.get(
        `${Endpoint.GET_PRODUCT_ITEM_WITH_ID}/${id}`);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Get Product Item By ID Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch product item");
    }
  },

  // Update Product Item
  async updateProductItem(id: string, data: Partial<CreateProductItemData>): Promise<ApiResponse<ProductItem>> {
    try {
      const response: AxiosResponse<ApiResponse<ProductItem>> = await Request.put(
        `${Endpoint.UPDATE_PRODUCT_ITEM}/${id}`,
        data);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Update Product Item Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to update product item");
    }
  },

  // Delete Product Item
  async deleteProductItem(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_PRODUCT_ITEM}/${id}`);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Delete Product Item Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to delete product item");
    }
  },

  async bulkCreateProductItems(formData: FormData): Promise<ApiResponse<ProductItem[]>> {
    try {
      const response: AxiosResponse<ApiResponse<ProductItem[]>> = await Request.post(
        Endpoint.BULK_CREATE_PRODUCT_ITEMS,
        formData);

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Bulk Create Product Items Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to bulk create product items");
    }
  },
};