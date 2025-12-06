import { AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

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
  // streetAddress: string;
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
  async getAccountMasters(filters): Promise<ApiResponse<AccountMaster[]>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster[]>> = await Request.post(
        Endpoint.GET_ALL_ACCOUNT_MASTERS,filters);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch account masters");
    }
  },

  async getAccountMasterById(id: string): Promise<ApiResponse<AccountMaster>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await Request.get(
        `${Endpoint.GET_ACCOUNT_MASTER_BY_ID}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch account master");
    }
  },
  async getAccountMasterByStaffId(id: string,data:any): Promise<ApiResponse<AccountMaster>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await Request.post(
        `${Endpoint.GET_ACCOUNT_MASTER_BY_STAFF_ID}/${id}`,data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch account master");
    }
  },

  async createAccountMaster(data: CreateAccountMaster): Promise<ApiResponse<AccountMaster>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await Request.post(
        Endpoint.CREATE_ACCOUNT_MASTER,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create account master");
    }
  },

  async bulkCreateAccountMasters(formData: FormData): Promise<ApiResponse<AccountMaster[]>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster[]>> = await Request.post(
        Endpoint.BULK_CREATE_ACCOUNT_MASTERS,
        formData
      );
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to bulk create account masters");
    }
  },

  async updateAccountMaster(id: string, data: Partial<UpdateAccountMaster>): Promise<ApiResponse<AccountMaster>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await Request.patch(
        `${Endpoint.UPDATE_ACCOUNT_MASTER}/${id}`,
        data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update account master");
    }
  },

  async deleteAccountMaster(id: string): Promise<void> {
    try {
      await Request.delete(`${Endpoint.DELETE_ACCOUNT_MASTER}/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete account master");
    }
  },

  async getAccountMasterByCompanyAndParty(
    companyId: string,
    partyId: string
  ): Promise<ApiResponse<AccountMaster[]>> {
    try {
      const response: AxiosResponse<ApiResponse<AccountMaster[]>> = await Request.post(
        Endpoint.BY_COMPNAY_PARTY,
        { companyId, partyId }
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
      const response: AxiosResponse<ApiResponse<AccountMaster>> = await Request.put(
        `${Endpoint.UPDATE_APPROVED_ACCOUNT_MASTER}/${partyId}/approve`,
        {},
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to approve party");
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
  },
  async searchParties(query: string, companyId?: string): Promise<ApiResponse<PartySuggestion[]>> {
  try {
    const params: any = { q: query };
    
    // Add companyId to params if provided
    if (companyId) {
      params.companyId = companyId;
    }

    const response: AxiosResponse<ApiResponse<PartySuggestion[]>> = await Request.get(
      `${Endpoint.SEARCH_PARTIES}`,
      { params }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to search parties");
  }
},
};