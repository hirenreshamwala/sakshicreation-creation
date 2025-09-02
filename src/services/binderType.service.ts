import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

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
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const binderTypeService = {
  // Create BinderType
  async createBinderType(
    data: CreateBinderTypeData
  ): Promise<ApiResponse<BinderType>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");


      const response: AxiosResponse<ApiResponse<BinderType>> = await axios.post(
        Endpoint.CREATE_BINDER_TYPE,
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
      console.error("Create Binder Type Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to create binder type");
    }
  },

  // Get All BinderTypes
  async getAllBinderTypes(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<BinderType[]>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");


      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;

      const response: AxiosResponse<ApiResponse<BinderType[]>> = await axios.get(
        Endpoint.GET_ALL_BINDER_TYPE,
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
        totalCount: response.data.totalCount,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Get All Binder Types Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch binder types");
    }
  },

  // Get BinderType By ID
  async getBinderTypeById(id: string): Promise<ApiResponse<BinderType>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");


      const response: AxiosResponse<ApiResponse<BinderType>> = await axios.get(
        `${Endpoint.GET_BINDER_TYPE_WITH_ID}/${id}`,
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
      console.error("Get Binder Type By ID Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch binder type");
    }
  },

  // Update BinderType
  async updateBinderType(
    id: string,
    data: Partial<CreateBinderTypeData>
  ): Promise<ApiResponse<BinderType>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");


      const response: AxiosResponse<ApiResponse<BinderType>> = await axios.put(
        `${Endpoint.UPDATE_BINDER_TYPE}/${id}`,
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
      console.error("Update Binder Type Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to update binder type");
    }
  },

  // Delete BinderType
  async deleteBinderType(id: string): Promise<ApiResponse<null>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");


      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(
        `${Endpoint.DELETE_BINDER_TYPE}/${id}`,
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
      console.error("Delete Binder Type Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to delete binder type");
    }
  },

  // Bulk Create BinderTypes
  async bulkCreateBinderTypes(formData: FormData): Promise<ApiResponse<BinderType[]>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");


      const response: AxiosResponse<ApiResponse<BinderType[]>> = await axios.post(
        Endpoint.BULK_CREATE_BINDER_TYPES,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
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
      console.error("Bulk Create Binder Types Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to bulk create binder types");
    }
  },
};
