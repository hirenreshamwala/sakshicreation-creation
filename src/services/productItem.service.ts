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

  // services/productItem.service.ts (update getAllProductItems and add getProductItemFilters)
async getAllProductItems(filters: Partial<ProductItemFilters> = {}): Promise<ApiResponse<ProductItem[]>> {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.itemNames?.length) filters.itemNames.forEach(v => params.append("itemNames", v));
    const response: AxiosResponse<ApiResponse<ProductItem[]>> = await Request.get(
      `${Endpoint.GET_ALL_PRODUCT_ITEM}?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch product items");
  }
},

async getProductItemFilters(): Promise<AvailableFilters> {
  try {
    const response = await Request.get(Endpoint.GET_PRODUCT_ITEM_FILTERS);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to load filters");
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