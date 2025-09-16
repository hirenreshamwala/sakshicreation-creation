import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { marketService, Market } from "@/services/marketData.service";
import Endpoint from "@/API/apiConfig";
import Request from "@/services/axios";

// ✅ Create Market
export const createMarketThunk = createAsyncThunk(
  "markets/create",
  async (marketData: Omit<Market, "_id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await marketService.createMarket(marketData);
      if (response && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create market");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create market");
    }
  }
);

// ✅ Get All Markets
export const getAllMarketsThunk = createAsyncThunk(
  "markets/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await marketService.getAllMarkets();
      if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue("Invalid response format: data array not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch markets");
    }
  }
);

// ✅ Update Market
export const updateMarketThunk = createAsyncThunk(
  "markets/update",
  async ({ id, updateData }: { id: string; updateData: Partial<Market> }, { rejectWithValue }) => {
    try {
      const response = await marketService.updateMarket(id, updateData);
      if (response && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update market");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update market");
    }
  }
);

// ✅ Delete Market
export const deleteMarketThunk = createAsyncThunk(
  "markets/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await marketService.deleteMarket(id);
      if (response.success !== false) {
        return id; // Return the deleted market ID
      } else {
        return rejectWithValue(response.message || "Failed to delete market");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete market");
    }
  }
);

// ✅ Bulk Upload Markets
export const bulkCreateMarketsThunk = createAsyncThunk(
  "markets/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await Request.post(Endpoint.BULK_UPLOAD_MARKETS, formData);

      if (response.data.success === false) {
        throw new Error(response.data.message || "Bulk create failed");
      }

      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Failed to bulk create markets";
      return rejectWithValue(message);
    }
  }
);

interface MarketsState {
  markets: Market[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  operationError: string | null;
}

const initialState: MarketsState = {
  markets: [],
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,
};

const marketsSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
      state.operationError = null;
    },
    clearOperationError(state) {
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Market
      .addCase(createMarketThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createMarketThunk.fulfilled, (state, action: PayloadAction<Market>) => {
        state.operationLoading = false;
        state.markets = [action.payload, ...state.markets]
      })
      .addCase(createMarketThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Get All Markets
      .addCase(getAllMarketsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllMarketsThunk.fulfilled, (state, action: PayloadAction<Market[]>) => {
        state.loading = false;
        state.markets = action.payload;
      })
      .addCase(getAllMarketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.markets = [];
      })
      // Update Market
      .addCase(updateMarketThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(updateMarketThunk.fulfilled, (state, action: PayloadAction<Market>) => {
        state.operationLoading = false;
        const index = state.markets.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.markets[index] = action.payload;
        }
      })
      .addCase(updateMarketThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Delete Market
      .addCase(deleteMarketThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(deleteMarketThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.operationLoading = false;
        state.markets = state.markets.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteMarketThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Bulk Upload Markets
      .addCase(bulkCreateMarketsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateMarketsThunk.fulfilled, (state, action: any) => {
        state.loading = false;
        state.markets = [...state.markets, ...action.payload];
      })
      .addCase(bulkCreateMarketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearOperationError } = marketsSlice.actions;
export default marketsSlice.reducer;
