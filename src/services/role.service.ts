import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

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
      const response: AxiosResponse<ApiResponse<Role[]>> = await Request.get(
        Endpoint.GET_ALL_ROLES);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch roles");
    }
  },

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    try {

      const response: AxiosResponse<ApiResponse<Role>> = await Request.get(
        `${Endpoint.GET_ROLE_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  },

  async createRole(data: CreateRole): Promise<Role> {
    try {
      const response: AxiosResponse<Role> = await Request.post(
        Endpoint.CREATE_ROLE,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create role"
      );
    }
  },

  async updateRole(id: string, data: Partial<UpdateRole>): Promise<Role> {
    try {
      const response: AxiosResponse<Role> = await Request.put(
        `${Endpoint.UPDATE_ROLE}/${id}`,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update role"
      );
    }
  },

  async deleteRole(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_ROLE}/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete role"
      );
    }
  },
};