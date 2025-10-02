import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { inventoryService, Inventory, ApiResponse } from '@/services/inventory.service';

export const getInventoryByCategoryThunk = createAsyncThunk(
  'inventory/getByCategory',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getInventoryByCategory(category);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
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
  'inventory/getall',
  async (_, { rejectWithValue }) => {
    try {
      const response = await inventoryService.getAllInventory();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory');
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
}

const initialState: InventoryState = {
  allInventory: [],
  inventory: [],
  summary: null,
  loading: false,
  updating: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
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
        (state, action: PayloadAction<Inventory[]>) => {
          state.loading = false;
          state.allInventory = action.payload;
        }
      )
      .addCase(getAllInventoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allInventory = [];
      })
      
      // Get inventory by category
      .addCase(getInventoryByCategoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getInventoryByCategoryThunk.fulfilled,
        (state, action: PayloadAction<Inventory[]>) => {
          state.loading = false;
          state.inventory = action.payload;
        }
      )
      .addCase(getInventoryByCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.inventory = [];
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

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;