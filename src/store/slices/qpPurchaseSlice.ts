import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    Purchase,
    CreatePurchase,
    UpdatePurchase,
    CompanyName,
    Role,
    Staff,
} from '@/services/purchase.service';
import { qualityPurchaseService } from '@/services/qpPurchase.service';

// Add these missing thunks for companies, roles, and staff
export const getQpCompaniesThunk = createAsyncThunk(
    'purchases/getCompanies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.getCompanies();
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            } else {
                return rejectWithValue('Invalid response format: companies array not found');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch companies');
        }
    }
);

export const getQpRolesThunk = createAsyncThunk(
    'purchases/getRoles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.getRoles();
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            } else {
                return rejectWithValue('Invalid response format: roles array not found');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch roles');
        }
    }
);

export const getQpStaffThunk = createAsyncThunk(
    'purchases/getStaff',
    async (_, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.getStaff();
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            } else {
                return rejectWithValue('Invalid response format: staff array not found');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch staff');
        }
    }
);

export const getAllQpPurchasesThunk = createAsyncThunk(
    'purchases/getAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.getPurchases();
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            } else {
                return rejectWithValue('Invalid response format: data array not found');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch purchases');
        }
    }
);

export const getQpPurchaseByIdThunk = createAsyncThunk(
    'purchases/getById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.getPurchaseById(id);
            if (response.success) {
                return response.data;
            } else {
                return rejectWithValue('Failed to fetch purchase');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch purchase');
        }
    }
);

export const createQpPurchaseThunk = createAsyncThunk(
    'purchases/create',
    async (data: CreatePurchase, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.createPurchase(data);
            if (response.success) {
                return response.data;
            } else {
                return rejectWithValue(response.message || 'Failed to create purchase');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create purchase');
        }
    }
);

export const updateQpPurchaseThunk = createAsyncThunk(
    'purchases/update',
    async (
        { id, data }: { id: string; data: Partial<UpdatePurchase> },
        { rejectWithValue }
    ) => {
        try {
            const response = await qualityPurchaseService.updatePurchase(id, data);
            if (response.success) {
                return response.data;
            } else {
                return rejectWithValue(response.message || 'Failed to update purchase');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update purchase');
        }
    }
);

export const deleteQpPurchaseThunk = createAsyncThunk(
    'purchases/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.deletePurchase(id);
            if (response.success) {
                return id;
            } else {
                return rejectWithValue(response.message || 'Failed to delete purchase');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete purchase');
        }
    }
);

export const bulkCreateQpPurchasesThunk = createAsyncThunk(
    'purchases/bulkCreate',
    async (formData: FormData, { rejectWithValue }) => {
        try {
            const response = await qualityPurchaseService.bulkCreatePurchases(formData);
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            } else {
                return rejectWithValue(response.message || 'Invalid response format: data array not found');
            }
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to upload purchases');
        }
    }
);

interface PurchaseState {
    purchases: Purchase[];
    filteredPurchases: Purchase[];
    singlePurchase: Purchase | null;
    companies: CompanyName[];
    roles: Role[];
    staff: Staff[];
    loading: boolean;
    error: string | null;
    successMessage: string | null;
}

const initialState: PurchaseState = {
    purchases: [],
    filteredPurchases: [],
    singlePurchase: null,
    companies: [],
    roles: [],
    staff: [],
    loading: false,
    error: null,
    successMessage: null,
};

const purchaseSlice = createSlice({
    name: 'purchases',
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
        },
        clearSuccessMessage(state) {
            state.successMessage = null;
        },
        clearSinglePurchase(state) {
            state.singlePurchase = null;
        },
        clearFilteredPurchases(state) {
            state.filteredPurchases = [];
        },
        clearCompanies(state) {
            state.companies = [];
        },
        clearRoles(state) {
            state.roles = [];
        },
        clearStaff(state) {
            state.staff = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Companies
            .addCase(getQpCompaniesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                getQpCompaniesThunk.fulfilled,
                (state, action: PayloadAction<CompanyName[]>) => {
                    state.loading = false;
                    state.companies = action.payload;
                }
            )
            .addCase(getQpCompaniesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.companies = [];
            })
            // Get Roles
            .addCase(getQpRolesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                getQpRolesThunk.fulfilled,
                (state, action: PayloadAction<Role[]>) => {
                    state.loading = false;
                    state.roles = action.payload;
                }
            )
            .addCase(getQpRolesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.roles = [];
            })
            // Get Staff
            .addCase(getQpStaffThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                getQpStaffThunk.fulfilled,
                (state, action: PayloadAction<Staff[]>) => {
                    state.loading = false;
                    state.staff = action.payload;
                }
            )
            .addCase(getQpStaffThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.staff = [];
            })
            // Get All Purchases
            .addCase(getAllQpPurchasesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                getAllQpPurchasesThunk.fulfilled,
                (state, action: PayloadAction<Purchase[]>) => {
                    state.loading = false;
                    state.purchases = action.payload;
                    state.error = null;
                }
            )
            .addCase(getAllQpPurchasesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.purchases = [];
            })
            // Get Single Purchase
            .addCase(getQpPurchaseByIdThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                getQpPurchaseByIdThunk.fulfilled,
                (state, action: PayloadAction<Purchase>) => {
                    state.loading = false;
                    state.singlePurchase = action.payload;
                    state.error = null;
                }
            )
            .addCase(getQpPurchaseByIdThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.singlePurchase = null;
            })
            // Create Purchase
            .addCase(createQpPurchaseThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(
                createQpPurchaseThunk.fulfilled,
                (state, action: PayloadAction<Purchase>) => {
                    state.loading = false;
                    state.purchases = [action.payload, ...state.purchases];
                    state.successMessage = 'Purchase created successfully';
                    state.error = null;
                }
            )
            .addCase(createQpPurchaseThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.successMessage = null;
            })
            // Update Purchase
            .addCase(updateQpPurchaseThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(
                updateQpPurchaseThunk.fulfilled,
                (state, action: PayloadAction<Purchase>) => {
                    state.loading = false;
                    state.purchases = state.purchases.map((purchase) =>
                        purchase._id === action.payload._id ? action.payload : purchase
                    );
                    if (state.singlePurchase && state.singlePurchase._id === action.payload._id) {
                        state.singlePurchase = action.payload;
                    }
                    state.successMessage = 'Purchase updated successfully';
                    state.error = null;
                }
            )
            .addCase(updateQpPurchaseThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.successMessage = null;
            })
            // Delete Purchase
            .addCase(deleteQpPurchaseThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(
                deleteQpPurchaseThunk.fulfilled,
                (state, action: PayloadAction<string>) => {
                    state.loading = false;
                    state.purchases = state.purchases.filter(
                        (purchase) => purchase._id !== action.payload
                    );
                    if (state.singlePurchase && state.singlePurchase._id === action.payload) {
                        state.singlePurchase = null;
                    }
                    state.successMessage = 'Purchase deleted successfully';
                    state.error = null;
                }
            )
            .addCase(deleteQpPurchaseThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.successMessage = null;
            })
            // Bulk Create Purchases
            .addCase(bulkCreateQpPurchasesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.successMessage = null;
            })
            .addCase(
                bulkCreateQpPurchasesThunk.fulfilled,
                (state, action: PayloadAction<Purchase[]>) => {
                    state.loading = false;
                    state.purchases = [...action.payload, ...state.purchases];
                    state.successMessage = 'Bulk purchases uploaded successfully';
                    state.error = null;
                }
            )
            .addCase(bulkCreateQpPurchasesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.successMessage = null;
            });
    },
});

export const {
    clearError,
    clearSuccessMessage,
    clearSinglePurchase,
    clearFilteredPurchases,
    clearCompanies,
    clearRoles,
    clearStaff
} = purchaseSlice.actions;
export default purchaseSlice.reducer;