import axios, { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssignTask {
  assignedTo: string;
  status?: string;
  remarks?: string;
}

export interface Address {
  unitNo: string;
  marketName: string;
  streetAddress: string;
  landMark?: string;
  area: string;
  pincode: string;
}

export interface AccountMaster {
  _id: string;
  party?: any;
  assignment?: any;
  companyName: any;
  partyName: string;
  ownerName?: string;
  ownerMobileNo: string;
  ownerWhatsAppNo: string;
  ownerEmail?: string;
  contactPerson: string;
  personMobileNo: string;
  personWhatsAppNo: string;
  contactPersonEmail?: string;
  contactForPayment: string;
  contactMobileNo: string;
  contactWhatsAppNo: string;
  contactForPaymentEmail?: string;
  GSTNo: string;
  address: Address;
  reasonToVisit: string;
  reference: string;
  createdBy: User | any;
  createdById: string;
  assignedTo: AssignTask[] | string[];
  status: string;
  remarks: string;
  partyTag: string;
  statusApproval: "Pending" | "Approved";
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountMaster {
  companyName: string;
  partyName: string;
  ownerName?: string;
  ownerMobileNo: string;
  ownerWhatsAppNo: string;
  ownerEmail?: string;
  contactPerson: string;
  personMobileNo: string;
  personWhatsAppNo: string;
  contactPersonEmail?: string;
  contactForPayment: string;
  contactMobileNo: string;
  contactWhatsAppNo: string;
  contactForPaymentEmail?: string;
  GSTNo: string;
  address: Address;
  reasonToVisit: string;
  reference: string;
  createdBy: string;
  isRequestMode?: boolean;
}

export interface UpdateAccountMaster {
  companyName?: string;
  partyName?: string;
  ownerName?: string;
  ownerMobileNo?: string;
  ownerWhatsAppNo?: string;
  ownerEmail?: string;
  contactPerson?: string;
  personMobileNo?: string;
  personWhatsAppNo?: string;
  contactPersonEmail?: string;
  contactForPayment?: string;
  contactMobileNo?: string;
  contactWhatsAppNo?: string;
  contactForPaymentEmail?: string;
  GSTNo?: string;
  address?: Address;
  reasonToVisit?: string;
  reference?: string;
  createdBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  accountMasters?: T;
  data?: T;
  message?: string;
}

export interface PartySuggestion {
  _id: string;
  partyName: string;
}

export const accountMasterService = {
  async getAccountMasters(): Promise<ApiResponse<AccountMaster[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster[]>> = await axios.get(
        Endpoint.GET_ALL_ACCOUNT_MASTERS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      console.log("🚀 ~ getAccountMasters ~ response:", response.data)
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch account masters");
    }
  },

  async getAccountMasterById(id: string): Promise<ApiResponse<AccountMaster>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await axios.get(
        `${Endpoint.GET_ACCOUNT_MASTER_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch account master");
    }
  },
  async getAccountMasterByStaffId(id: string): Promise<ApiResponse<AccountMaster>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await axios.get(
        `${Endpoint.GET_ACCOUNT_MASTER_BY_STAFF_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch account master");
    }
  },

  async createAccountMaster(data: CreateAccountMaster): Promise<ApiResponse<AccountMaster>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await axios.post(
        Endpoint.CREATE_ACCOUNT_MASTER,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create account master");
    }
  },

  async bulkCreateAccountMasters(formData: FormData): Promise<ApiResponse<AccountMaster[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster[]>> = await axios.post(
        Endpoint.BULK_CREATE_ACCOUNT_MASTERS,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to bulk create account masters");
    }
  },

  async updateAccountMaster(id: string, data: Partial<UpdateAccountMaster>): Promise<ApiResponse<AccountMaster>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await axios.patch(
        `${Endpoint.UPDATE_ACCOUNT_MASTER}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update account master");
    }
  },

  async deleteAccountMaster(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      await axios.delete(`${Endpoint.DELETE_ACCOUNT_MASTER}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete account master");
    }
  },

  async getAccountMasterByCompanyAndParty(
    companyId: string,
    partyId: string
  ): Promise<ApiResponse<AccountMaster[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster[]>> = await axios.post(
        Endpoint.BY_COMPNAY_PARTY,
        { companyId, partyId },
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
      throw new Error(error.response?.data?.message || "Failed to fetch account master list");
    }
  },

  async approveParty(partyId: string): Promise<ApiResponse<AccountMaster>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await axios.put(
        `${Endpoint.UPDATE_APPROVED_ACCOUNT_MASTER}/${partyId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to approve party");
    }
  },
  async searchParties(query: string): Promise<ApiResponse<PartySuggestion[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response: AxiosResponse<ApiResponse<PartySuggestion[]>> = await axios.get(
        `${Endpoint.SEARCH_PARTIES}?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to search parties");
    }
  },
};