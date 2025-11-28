import { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

export interface Complaint {
  _id?: string;
  companyName: string;
  scorder?: string;
  qporder?: string;
  subject: string;
  detail: string;
  status?: string;
  response?: string;
  assignTo?: string[];
  createdBy?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const complainService = {
  async getAllComplains(): Promise<ApiResponse<Complaint[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint[]>> = await Request.get(
        `${Endpoint.GET_COMPLAINS}`
      );
      return { success: true, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      console.error("Get all complains error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch complains");
    }
  },

  async getComplainById(id: string): Promise<ApiResponse<Complaint>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint>> = await Request.get(
        `${Endpoint.GET_COMPLAIN_BY_ID}/${id}`
      );
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error("Get complain by id error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch complain");
    }
  },

  async createComplain(payload: Complaint): Promise<ApiResponse<Complaint>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint>> = await Request.post(
        `${Endpoint.CREATE_COMPLAIN}`,
        payload
      );
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error("Create complain error:", error);
      throw new Error(error.response?.data?.message || "Failed to create complain");
    }
  },

  async updateComplain(id: string, payload: Partial<Complaint>): Promise<ApiResponse<Complaint>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint>> = await Request.put(
        `${Endpoint.UPDATE_COMPLAIN}/${id}`,
        payload
      );
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error("Update complain error:", error);
      throw new Error(error.response?.data?.message || "Failed to update complain");
    }
  },

  async deleteComplain(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await Request.delete(
        `${Endpoint.DELETE_COMPLAIN}/${id}`
      );
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.error("Delete complain error:", error);
      throw new Error(error.response?.data?.message || "Failed to delete complain");
    }
  },
  async getComplainsByStaff(staffId: string): Promise<ApiResponse<Complaint[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint[]>> = await Request.get(
        `${Endpoint.GET_COMPLAINS_STAFF}/${staffId}`
      );
      return { success: true, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      console.error("Get complains by staff error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch complains by staff");
    }
  },
   async searchFilterOptions(field: string, searchTerm: string, filters?: any): Promise<ApiResponse<string[]>> {
    try {
      const payload = {
        ...(filters || {}),
        search: searchTerm
      };
      
      const response: AxiosResponse<ApiResponse<string[]>> = await Request.post(
        `${Endpoint.ACCOUNT_MASTER_FILTER}/${field}`,
        payload
      );
      return { 
        success: true, 
        data: response.data.data || [], 
        message: response.data.message 
      };
    } catch (error: any) {
      console.error(`Search ${field} options error:`, error);
      throw new Error(error.response?.data?.message || `Failed to search ${field} options`);
    }
  }
}
