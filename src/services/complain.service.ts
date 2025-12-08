import { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import Request from "./axios";

export interface Complaint {
    _id?: string;
    subject: string;
    details: string;
    company: {
        _id: string;
        companyName: string;
    };
    status: string;
    response: string;
    createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    assignTo: string[];
    scorder?: {
        _id: string;
        orderNumber: string;
    };
    qporder?: {
        _id: string;
        orderNo: number;
    };
    party: {
        _id: string;
        partyName: string;
    };
    filePaths?: string[];
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    totalCount?: number;
}

export const complainService = {
    // Get all complains with pagination and filtering
    async getAllComplains(filters?: any): Promise<ApiResponse<Complaint[]>> {
        try {
            const response: AxiosResponse<ApiResponse<Complaint[]>> = await Request.post(
                `${Endpoint.GET_COMPLAINS}`,
                filters || {}
            );

            return {
                success: true,
                data: response.data.data || [],
                message: response.data.message,
                pagination: response.data.pagination,
                totalCount: response.data.totalCount
            };
        } catch (error: any) {
            console.error("Get all complains error:", error);
            throw new Error(error.response?.data?.message || "Failed to fetch complains");
        }
    },

    // Get complain by ID
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

    // Create complain
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

    // Update complain
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

    // Delete complain
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

    // Get complains by staff
    async getComplainsByStaff(staffId: string, filters?: any): Promise<ApiResponse<Complaint[]>> {
        try {
            const response: AxiosResponse<ApiResponse<Complaint[]>> = await Request.post(
                `${Endpoint.GET_COMPLAINS_STAFF}/${staffId}`,
                filters || {}
            );
            return {
                success: true,
                data: response.data.data || [],
                message: response.data.message,
                pagination: response.data.pagination,
                totalCount: response.data.totalCount
            };
        } catch (error: any) {
            console.error("Get complains by staff error:", error);
            throw new Error(error.response?.data?.message || "Failed to fetch complains by staff");
        }
    },

    // Search filter options
    async searchFilterOptions(field: string, searchTerm: string, filters?: any): Promise<ApiResponse<string[]>> {
        try {
            const response: AxiosResponse<ApiResponse<string[]>> = await Request.post(
                `${Endpoint.GET_COMPLAIN_FILTER_OPTIONS}/${field}`,
                { search: searchTerm, ...filters }
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
};