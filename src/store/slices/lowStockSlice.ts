import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  lowStockService, 
  LowStock, 
  CreateLowStock, 
  LowStockStatus 
} from '@/services/lowStock.service';

// Thunks
export const getAllLowStocksThunk = createAsyncThunk(
  'lowStock/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lowStockService.getLowStocks();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch low stocks');
    }
  }
);

export const getLowStockByIdThunk = createAsyncThunk(
  'lowStock/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await lowStockService.getLowStockById(id);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue('Failed to fetch low stock');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch low stock');
    }
  }
);

export const createLowStockThunk = createAsyncThunk(
  'lowStock/create',
  async (data: CreateLowStock, { rejectWithValue }) => {
    try {
      const response = await lowStockService.createLowStock(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create low stock');
    }
  }
);

export const updateLowStockThunk = createAsyncThunk(
  'lowStock/update',
  async ({ id, data }: { id: string; data: Partial<CreateLowStock> }, { rejectWithValue }) => {
    try {
      const response = await lowStockService.updateLowStock(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update low stock');
    }
  }
);

export const deleteLowStockThunk = createAsyncThunk(
  'lowStock/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await lowStockService.deleteLowStock(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete low stock');
    }
  }
);

export const checkLowStockStatusThunk = createAsyncThunk(
  'lowStock/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lowStockService.checkLowStockStatus();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check low stock status');
    }
  }
);

interface LowStockState {
  lowStocks: LowStock[];
  singleLowStock: LowStock | null;
  lowStockStatus: LowStockStatus[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: LowStockState = {
  lowStocks: [],
  singleLowStock: null,
  lowStockStatus: [],
  loading: false,
  error: null,
  successMessage: null,
};

const lowStockSlice = createSlice({
  name: 'lowStock',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleLowStock(state) {
      state.singleLowStock = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Low Stocks
      .addCase(getAllLowStocksThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllLowStocksThunk.fulfilled, (state, action: PayloadAction<LowStock[]>) => {
        state.loading = false;
        state.lowStocks = action.payload;
        state.error = null;
      })
      .addCase(getAllLowStocksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Single Low Stock
      .addCase(getLowStockByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLowStockByIdThunk.fulfilled, (state, action: PayloadAction<LowStock>) => {
        state.loading = false;
        state.singleLowStock = action.payload;
        state.error = null;
      })
      .addCase(getLowStockByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Low Stock
      .addCase(createLowStockThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createLowStockThunk.fulfilled, (state, action: PayloadAction<LowStock>) => {
        state.loading = false;
        state.lowStocks = [action.payload, ...state.lowStocks];
        state.successMessage = 'Low stock configuration created successfully';
        state.error = null;
      })
      .addCase(createLowStockThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Low Stock
      .addCase(updateLowStockThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateLowStockThunk.fulfilled, (state, action: PayloadAction<LowStock>) => {
        state.loading = false;
        state.lowStocks = state.lowStocks.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
        if (state.singleLowStock && state.singleLowStock.id === action.payload.id) {
          state.singleLowStock = action.payload;
        }
        state.successMessage = 'Low stock configuration updated successfully';
        state.error = null;
      })
      .addCase(updateLowStockThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Low Stock
      .addCase(deleteLowStockThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteLowStockThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.lowStocks = state.lowStocks.filter((item) => item.id !== action.payload);
        if (state.singleLowStock && state.singleLowStock.id === action.payload) {
          state.singleLowStock = null;
        }
        state.successMessage = 'Low stock configuration deleted successfully';
        state.error = null;
      })
      .addCase(deleteLowStockThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Check Low Stock Status
      .addCase(checkLowStockStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkLowStockStatusThunk.fulfilled, (state, action: PayloadAction<LowStockStatus[]>) => {
        state.loading = false;
        state.lowStockStatus = action.payload;
        state.error = null;
      })
      .addCase(checkLowStockStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleLowStock } = lowStockSlice.actions;
export default lowStockSlice.reducer;
