import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface Address {
  unitNo: string;
  marketName: string;
  // streetAddress: string;
  landMark?: string;
  area: string;
  pincode: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssignTask {
  _id: string;
  companyName: string;
  partyName: string;
  date: string;
  time: string;
  reasonForVisit: string;
  assignTo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rescheduleDate?: string;
  originalTaskId?: {
    _id: string;
    date: string;
    status: string;
    createdAt: string; // Add createdAt for originalTaskId
  };
  visitDate?: string;
  visitTime?: string;
  feedback?: string;
  accountDetails: {
    _id: string;
    companyName: string;
    partyName: string;
    ownerName: string;
    ownerMobileNo: string;
    ownerWhatsAppNo: string;
    contactPerson: string;
    personMobileNo: string;
    personWhatsAppNo: string;
    contactForPayment: string;
    contactMobileNo: string;
    contactWhatsAppNo: string;
    GSTNo: string;
    address: Address;
    reasonToVisit: string;
    createdBy: User | string;
    assignedTo: string[];
    status: string;
    remarks: string;
    partyTag: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreateAssignTask {
  companyName: string;
  partyName: string;
  date: string;
  time: string;
  reasonForVisit: string;
  assignTo: string;
  remarks?: string;
  visitDate?: string;
  visitTime?: string;
  feedback?: string;
  status?: string;
  rescheduleDate?: string;
}

export interface UpdateAssignTask {
  companyName?: string;
  partyName?: string;
  date?: string;
  time?: string;
  reasonForVisit?: string;
  assignTo?: string;
  status?: string;
  visitDate?: string;
  visitTime?: string;
  feedback?: string;
  rescheduleDate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const assignTaskService = {
  async getAllAssignTasks(filters: Record<string, any>): Promise<ApiResponse<AssignTask[]>> {
    try {
      console.log("DEBUG : getAllAssignTasks : filters:", filters);
      const response: AxiosResponse<ApiResponse<AssignTask[]>> = await Request.post(
        Endpoint.GET_ALL_ASSIGN_TASKS, filters);

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned tasks');
    }
  },

  async getAssignTaskById(id: string): Promise<ApiResponse<AssignTask>> {
    try {
      const response: AxiosResponse<ApiResponse<AssignTask>> = await Request.get(
        `${Endpoint.GET_ASSIGN_TASK_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned task');
    }
  },
  async getAssignTaskByStaffId(id: string): Promise<ApiResponse<AssignTask>> {
    try {
      const response: AxiosResponse<ApiResponse<AssignTask>> = await Request.get(
        `${Endpoint.GET_ASSIGN_TASK_BY_STAFF_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch assigned task');
    }
  },

  async createAssignTask(data: CreateAssignTask): Promise<AssignTask> {
    try {
      const response: AxiosResponse<AssignTask> = await Request.post(
        Endpoint.CREATE_ASSIGN_TASK,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create assigned task');
    }
  },

  async updateAssignTask(id: string, data: Partial<UpdateAssignTask>): Promise<AssignTask> {
    try {
      const response: AxiosResponse<AssignTask> = await Request.patch(
        `${Endpoint.UPDATE_ASSIGN_TASK}/${id}`,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update assigned task');
    }
  },

  async deleteAssignTask(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await Request.delete(
        `${Endpoint.DELETE_ASSIGN_TASK}/${id}`);
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete assigned task');
    }
  }
};