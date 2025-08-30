import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  purchaseService,
  Purchase,
  CreatePurchase,
  UpdatePurchase,
  CompanyName,
  Role,
  Staff,
} from '@/services/purchase.service';

// Thunks
export const getCompaniesThunk = createAsyncThunk(
  'purchases/getCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getCompanies();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch companies');
    }
  }
);

export const getRolesThunk = createAsyncThunk(
  'purchases/getRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getRoles();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch roles');
    }
  }
);

export const getStaffByRoleThunk = createAsyncThunk(
  'purchases/getStaffByRole',
  async (roleId: string, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getStaffByRole(roleId);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff by role');
    }
  }
);

export const getAllPurchasesThunk = createAsyncThunk(
  'purchases/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getPurchases();
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

export const getPurchaseByIdThunk = createAsyncThunk(
  'purchases/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getPurchaseById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch purchase');
    }
  }
);

export const createPurchaseThunk = createAsyncThunk(
  'purchases/create',
  async (data: CreatePurchase, { rejectWithValue }) => {
    try {
      const response = await purchaseService.createPurchase(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create purchase');
    }
  }
);

export const updatePurchaseThunk = createAsyncThunk(
  'purchases/update',
  async (
    { id, data }: { id: string; data: Partial<UpdatePurchase> },
    { rejectWithValue }
  ) => {
    try {
      const response = await purchaseService.updatePurchase(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update purchase');
    }
  }
);

export const deletePurchaseThunk = createAsyncThunk(
  'purchases/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await purchaseService.deletePurchase(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete purchase');
    }
  }
);

export const getPurchasesByMaterialThunk = createAsyncThunk(
  'purchases/getByMaterial',
  async (materialId: string, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getPurchasesByMaterial(materialId);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch purchases by material');
    }
  }
);

export const getPurchasesByCompanyThunk = createAsyncThunk(
  'purchases/getByCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getPurchasesByCompany(companyId);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch purchases by company');
    }
  }
);

export const getPurchasesByDateRangeThunk = createAsyncThunk(
  'purchases/getByDateRange',
  async ({ startDate, endDate }: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await purchaseService.getPurchasesByDateRange(startDate, endDate);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch purchases by date range');
    }
  }
);
export const bulkCreatePurchasesThunk = createAsyncThunk(
  'purchases/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await purchaseService.bulkCreatePurchases(formData);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
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
      .addCase(getCompaniesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getCompaniesThunk.fulfilled,
        (state, action: PayloadAction<CompanyName[]>) => {
          state.loading = false;
          state.companies = action.payload;
        }
      )
      .addCase(getCompaniesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.companies = [];
      })
      // Get Roles
      .addCase(getRolesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getRolesThunk.fulfilled,
        (state, action: PayloadAction<Role[]>) => {
          state.loading = false;
          state.roles = action.payload;
        }
      )
      .addCase(getRolesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.roles = [];
      })
      // Get Staff by Role
      .addCase(getStaffByRoleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getStaffByRoleThunk.fulfilled,
        (state, action: PayloadAction<Staff[]>) => {
          state.loading = false;
          state.staff = action.payload;
        }
      )
      .addCase(getStaffByRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.staff = [];
      })
      // Get All Purchases
      .addCase(getAllPurchasesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllPurchasesThunk.fulfilled,
        (state, action: PayloadAction<Purchase[]>) => {
          state.loading = false;
          state.purchases = action.payload;
        }
      )
      .addCase(getAllPurchasesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.purchases = [];
      })
      // Get Single Purchase
      .addCase(getPurchaseByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPurchaseByIdThunk.fulfilled,
        (state, action: PayloadAction<Purchase>) => {
          state.loading = false;
          state.singlePurchase = action.payload;
          state.successMessage = 'Purchase fetched successfully';
        }
      )
      .addCase(getPurchaseByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Purchase
      .addCase(createPurchaseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createPurchaseThunk.fulfilled,
        (state, action: PayloadAction<Purchase>) => {
          state.loading = false;
          state.purchases = [action.payload, ...state.purchases];
          state.successMessage = 'Purchase created successfully';
        }
      )
      .addCase(createPurchaseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Purchase
      .addCase(updatePurchaseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updatePurchaseThunk.fulfilled,
        (state, action: PayloadAction<Purchase>) => {
          state.loading = false;
          state.purchases = state.purchases.map((purchase) =>
            purchase._id === action.payload._id ? action.payload : purchase
          );
          state.successMessage = 'Purchase updated successfully';
          state.error = null;
        }
      )
      .addCase(updatePurchaseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Purchase
      .addCase(deletePurchaseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deletePurchaseThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.purchases = state.purchases.filter(
            (purchase) => purchase._id !== action.payload
          );
          state.successMessage = 'Purchase deleted successfully';
        }
      )
      .addCase(deletePurchaseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get Purchases by Material
      .addCase(getPurchasesByMaterialThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPurchasesByMaterialThunk.fulfilled,
        (state, action: PayloadAction<Purchase[]>) => {
          state.loading = false;
          state.filteredPurchases = action.payload;
        }
      )
      .addCase(getPurchasesByMaterialThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.filteredPurchases = [];
      })
      // Get Purchases by Company
      .addCase(getPurchasesByCompanyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPurchasesByCompanyThunk.fulfilled,
        (state, action: PayloadAction<Purchase[]>) => {
          state.loading = false;
          state.filteredPurchases = action.payload;
        }
      )
      .addCase(getPurchasesByCompanyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.filteredPurchases = [];
      })
      // Get Purchases by Date Range
      .addCase(getPurchasesByDateRangeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPurchasesByDateRangeThunk.fulfilled,
        (state, action: PayloadAction<Purchase[]>) => {
          state.loading = false;
          state.filteredPurchases = action.payload;
        }
      )
      .addCase(getPurchasesByDateRangeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.filteredPurchases = [];
      })
      .addCase(bulkCreatePurchasesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkCreatePurchasesThunk.fulfilled,
        (state, action: PayloadAction<Purchase[]>) => {
          state.loading = false;
          state.purchases = [...action.payload, ...state.purchases];
          state.successMessage = 'Bulk purchases uploaded successfully';
        }
      )
      .addCase(bulkCreatePurchasesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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