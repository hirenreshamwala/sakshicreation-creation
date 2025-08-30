import axios, { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Permission {
  [key: string]: {
    [key: string]: boolean;
  };
}

export interface Role {
  _id: string;
  roleName: string;
  isDelete: boolean;
  totalUser: number;
  permissions: Permission;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRole {
  roleName: string;
  permissions: Permission;
}

export interface UpdateRole {
  roleName?: string;
  permissions?: Permission;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const roleService = {
  async getAllRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<Role[]>> = await axios.get(
        Endpoint.GET_ALL_ROLES,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch roles");
    }
  },

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<Role>> = await axios.get(
        `${Endpoint.GET_ROLE_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  },

  async createRole(data: CreateRole): Promise<Role> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<Role> = await axios.post(
        Endpoint.CREATE_ROLE,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create role"
      );
    }
  },

  async updateRole(id: string, data: Partial<UpdateRole>): Promise<Role> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<Role> = await axios.put(
        `${Endpoint.UPDATE_ROLE}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update role"
      );
    }
  },

  async deleteRole(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      await axios.delete(`${Endpoint.DELETE_ROLE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete role"
      );
    }
  },
};