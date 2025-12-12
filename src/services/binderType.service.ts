// services/binderType.service.ts
import { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

interface BinderType {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateBinderTypeData {
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  totalCount?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Available filters response
interface BinderTypeFiltersResponse {
  binderNames: string[];
}

export const binderTypeService = {
  // Create BinderType
  async createBinderType(data: CreateBinderTypeData): Promise<ApiResponse<BinderType>> {
    try {
      const response: AxiosResponse<ApiResponse<BinderType>> = await Request.post(
        Endpoint.CREATE_BINDER_TYPE,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create binder type");
    }
  },

  // GET ALL — Now supports page, limit, search, AND binderNames[] filter
  async getAllBinderTypes(params: {
    page?: number;
    limit?: number;
    search?: string;
    binderNames?: string[];
  } = {}): Promise<ApiResponse<BinderType[]>> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append("page", String(params.page));
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.search) queryParams.append("search", params.search);
      if (params.binderNames?.length) {
        params.binderNames.forEach(name => queryParams.append("binderNames", name));
      }

      const url = `${Endpoint.GET_ALL_BINDER_TYPE}?${queryParams.toString()}`;
      const response: AxiosResponse<ApiResponse<BinderType[]>> = await Request.get(url);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Get All Binder Types Error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch binder types");
    }
  },

  // NEW: Get filter options (for dropdown in table)
  async getBinderTypeFilters(): Promise<BinderTypeFiltersResponse> {
    try {
      const response = await Request.get(Endpoint.GET_BINDER_TYPE_FILTERS);
      return response.data; // { binderNames: ["A4 Ring", "Spiral", ...] }
    } catch (error: any) {
      console.error("Failed to load binder type filters:", error);
      throw new Error("Could not load filters");
    }
  },

  // Get By ID
  async getBinderTypeById(id: string): Promise<ApiResponse<BinderType>> {
    try {
      const response: AxiosResponse<ApiResponse<BinderType>> = await Request.get(
        `${Endpoint.GET_BINDER_TYPE_WITH_ID}/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch binder type");
    }
  },

  // Update
  async updateBinderType(
    id: string,
    data: Partial<CreateBinderTypeData>
  ): Promise<ApiResponse<BinderType>> {
    try {
      const response: AxiosResponse<ApiResponse<BinderType>> = await Request.put(
        `${Endpoint.UPDATE_BINDER_TYPE}/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update binder type");
    }
  },

  // Delete
  async deleteBinderType(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_BINDER_TYPE}/${id}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete binder type");
    }
  },

  // Bulk Create
  async bulkCreateBinderTypes(formData: FormData): Promise<ApiResponse<BinderType[]>> {
    try {
      const response: AxiosResponse<ApiResponse<BinderType[]>> = await Request.post(
        Endpoint.BULK_CREATE_BINDER_TYPES,
        formData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Bulk upload failed");
    }
  },
};