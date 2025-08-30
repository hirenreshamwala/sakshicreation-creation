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

interface InventoryState {
  inventory: Inventory[];
  summary: { lastPurchase: number, usedQty: number, balance: number } | null;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  inventory: [],
  summary: null,
  loading: false,
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
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;