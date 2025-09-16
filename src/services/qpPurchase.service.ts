import { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import Request from './axios';

export interface CompanyName {
    _id: string;
    companyName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Role {
    _id: string;
    roleName: string;
    isDelete: boolean;
    totalUser: number;
    createdAt: string;
    updatedAt: string;
}

export interface Staff {
    _id: string;
    firstName: string;
    lastName: string;
    role: string | Role;
    createdAt: string;
    updatedAt: string;
}

export interface Material {
    _id: string;
    materialName: string;
    materialSize: string;
    materialGSM: number;
    createdAt: string;
    updatedAt: string;
}
export interface Vendor {
    _id: string;
    name: string;
}

export interface Purchase {
    _id: string;
    vendorName: string | Vendor;
    billNumber: string;
    material: Material;
    quantity: number;
    ratePerSheet: number;
    kg: number;
    companyName: CompanyName;
    for: Role;
    forCompany: Staff | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePurchase {
    vendorName: string;
    billNumber: string;
    material: string;
    quantity: number;
    ratePerSheet: number;
    kg: number;
    companyName: string;
    for: string;
    forCompany: string;
}

export interface UpdatePurchase {
    vendorName?: string;
    billNumber?: string;
    material?: string;
    quantity?: number;
    ratePerSheet?: number;
    kg?: number;
    companyName?: string;
    for?: string;
    forCompany?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    count?: number;
}

export const qualityPurchaseService = {

    async getPurchases(): Promise<ApiResponse<Purchase[]>> {
        try {
            const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.get(
                Endpoint.GET_ALL_QP_PURCHASES);
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to fetch purchases'
            );
        }
    },

    async getPurchaseById(id: string): Promise<ApiResponse<Purchase>> {
        try {
            const response: AxiosResponse<ApiResponse<Purchase>> = await Request.get(
                `${Endpoint.GET_QP_PURCHASE_BY_ID}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to fetch purchase'
            );
        }
    },

    async createPurchase(data: CreatePurchase): Promise<Purchase> {
        try {
            const response: AxiosResponse<ApiResponse<Purchase>> = await Request.post(
                Endpoint.CREATE_QP_PURCHASE,
                data);
            return response.data.data!;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to create purchase'
            );
        }
    },

    async updatePurchase(id: string, data: Partial<UpdatePurchase>): Promise<Purchase> {
        try {
            const response: AxiosResponse<ApiResponse<Purchase>> = await Request.patch(
                `${Endpoint.UPDATE_QP_PURCHASE}/${id}`,
                data);
            return response.data.data!;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to update purchase'
            );
        }
    },

    async deletePurchase(id: string): Promise<void> {
        try {
            await Request.delete(`${Endpoint.DELETE_QP_PURCHASE}/${id}`);
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to delete purchase'
            );
        }
    },

    async bulkCreatePurchases(formData: FormData): Promise<ApiResponse<Purchase[]>> {
        try {
            const response: AxiosResponse<ApiResponse<Purchase[]>> = await Request.post(
                Endpoint.BULK_CREATE_QP_PURCHASES,
                formData);
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 'Failed to upload purchases'
            );
        }
    },
};