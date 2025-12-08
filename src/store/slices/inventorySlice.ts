import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { inventoryService, Inventory, ApiResponse } from '@/services/inventory.service';

export const getInventoryByCategoryThunk = createAsyncThunk(
  'inventory/getByCategory',
  async (paramsOrCategory: string | any, { rejectWithValue }) => {
    try {
      let response;
      if (typeof paramsOrCategory === 'string') {
        response = await inventoryService.getInventoryByCategory({ category: paramsOrCategory, isPagination: false });
      } else {
        response = await inventoryService.getInventoryByCategory(paramsOrCategory);
      }
      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          totalCount: response.totalCount || 0, // For pagination
        };
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory');
    }
  }
);

export const getInventorySummaryThunk = createAsyncThunk(
  'inventory/getSummary',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getInventorySummary(category);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory summary');
    }
  }
);

export const getAllInventoryThunk = createAsyncThunk(
  'inventory/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getAllInventory();
      if (response.success && response.data) {
        return {
          data: response.data,
          totalCount: response.data.length || 0,
          pagination: null,
        };
      } else {
        return rejectWithValue('Invalid response format: data not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory');
    }
  }
);

export const getAllInventoryForQualitThunk = createAsyncThunk(
  'inventory/getAllForQuality',
  async (params?: any, { rejectWithValue }) => { // Now accepts params
    try {
      const response = await inventoryService.getAllInventoryForQuality(params); 
      if (response.success && response.data) {
        return {
          data: response.data,
          totalCount: response.totalCount || 0,
          pagination: response.pagination || null,
        };
      } else {
        return rejectWithValue('Invalid response format: data not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory');
    }
  }
);

// Add filter options thunk
export const getInventoryFilterOptionsThunk = createAsyncThunk(
  'inventory/getFilterOptions',
  async ({ field, filters }: { field: string; filters: any }, { rejectWithValue }) => {
    try {
      const response = await inventoryService.searchFilterOptions(field, '', filters);
      if (response.success && Array.isArray(response.data)) {
        return { field, options: response.data };
      } else {
        return rejectWithValue('Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch filter options');
    }
  }
);

// NEW: Update inventory item thunk
export const updateInventoryItemThunk = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, updateData }: { id: string; updateData: Partial<Inventory> }, { rejectWithValue }) => {
    try {
      const response = await inventoryService.updateInventoryItem(id, updateData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update inventory item');
    }
  }
);

interface InventoryState {
  allInventory: Inventory[];
  inventory: Inventory[];
  summary: { lastPurchase: number, usedQty: number, balance: number } | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
  totalCount?: number;
  filterOptions: { [key: string]: string[] }; // For filter data
}

const initialState: InventoryState = {
  allInventory: [],
  inventory: [],
  summary: null,
  loading: false,
  updating: false,
  error: null,
  totalCount: 0,
  filterOptions: {},
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setFilterOptions(state, action: PayloadAction<{ field: string; options: string[] }>) {
      state.filterOptions[action.payload.field] = action.payload.options;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all inventory
      .addCase(getAllInventoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllInventoryThunk.fulfilled,
        (state, action: PayloadAction<{ data: Inventory[]; totalCount: number; pagination: any }>) => {
          state.loading = false;
          state.allInventory = action.payload.data;
          state.totalCount = action.payload.totalCount;
        }
      )
      .addCase(getAllInventoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allInventory = [];
      })
      // Filter options
      .addCase(getInventoryFilterOptionsThunk.fulfilled, (state, action) => {
        state.filterOptions[action.payload.field] = action.payload.options;
      })
      .addCase(getInventoryFilterOptionsThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
     
      // Get inventory by category
      .addCase(getInventoryByCategoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getInventoryByCategoryThunk.fulfilled,
        (state, action: PayloadAction<{ data: Inventory[]; totalCount: number }>) => {
          state.loading = false;
          state.inventory = action.payload.data;
          state.totalCount = action.payload.totalCount;
        }
      )
      .addCase(getInventoryByCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.inventory = [];
        state.totalCount = 0;
      })
      
      // Get inventory summary
      .addCase(getInventorySummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getInventorySummaryThunk.fulfilled,
        (state, action: PayloadAction<{ lastPurchase: number, usedQty: number, balance: number }>) => {
          state.loading = false;
          state.summary = action.payload;
        }
      )
      .addCase(getInventorySummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.summary = null;
      })
     
      // Get all inventory for quality
      .addCase(getAllInventoryForQualitThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllInventoryForQualitThunk.fulfilled,
        (state, action: PayloadAction<{ data: Inventory[]; totalCount: number; pagination: any }>) => {
          state.loading = false;
          state.allInventory = action.payload.data || [];
          state.totalCount = action.payload.totalCount || 0;
          console.log('🔄 Redux: Inventory updated with', action.payload.data?.length || 0, 'items');
        }
      )
      .addCase(getAllInventoryForQualitThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allInventory = [];
        state.totalCount = 0;
      })
      // NEW: Update inventory item
      .addCase(updateInventoryItemThunk.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(
        updateInventoryItemThunk.fulfilled,
        (state, action: PayloadAction<Inventory>) => {
          state.updating = false;
          
          // Update the item in allInventory array
          const index = state.allInventory.findIndex(item => item._id === action.payload._id);
          if (index !== -1) {
            state.allInventory[index] = action.payload;
          }
          
          // Update the item in inventory array (category-specific)
          const categoryIndex = state.inventory.findIndex(item => item._id === action.payload._id);
          if (categoryIndex !== -1) {
            state.inventory[categoryIndex] = action.payload;
          }
        }
      )
      .addCase(updateInventoryItemThunk.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError ,setFilterOptions} = inventorySlice.actions;
export default inventorySlice.reducer;