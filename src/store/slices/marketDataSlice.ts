import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { marketService, Market } from "@/services/marketData.service";
import Endpoint from "@/API/apiConfig";
import Request from "@/services/axios";

// Types
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface MarketFilters {
  page: number;
  limit: number;
  search: string;
  marketNames?: string[];
  areas?: string[];
  landmarks?: string[];
  pincodes?: string[];
}

interface AvailableFilters {
  marketNames: string[];
  areas: string[];
  landmarks: string[];
  pincodes: string[];
}

interface MarketsState {
  markets: Market[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  operationError: string | null;

  // Server-side state
  pagination: Pagination | null;
  filters: MarketFilters;
  availableFilters: AvailableFilters;
}

// Initial State
const initialState: MarketsState = {
  markets: [],
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,

  pagination: null,
  filters: {
    page: 1,
    limit: 10,
    search: "",
  },
  availableFilters: {
    marketNames: [],
    areas: [],
    landmarks: [],
    pincodes: [],
  },
};

// Async Thunks

// Create Market
export const createMarketThunk = createAsyncThunk(
  "markets/create",
  async (marketData: Omit<Market, "_id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await marketService.createMarket(marketData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create market");
    }
  }
);

// Get All Markets (Server-side with filters & pagination)
export const getAllMarketsThunk = createAsyncThunk(
  "markets/getAll",
  async (filters: Partial<MarketFilters> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.marketNames?.length) filters.marketNames.forEach(v => params.append("marketNames", v));
      if (filters.areas?.length) filters.areas.forEach(v => params.append("areas", v));
      if (filters.landmarks?.length) filters.landmarks.forEach(v => params.append("landmarks", v));
      if (filters.pincodes?.length) filters.pincodes.forEach(v => params.append("pincodes", v));

      const response = await Request.get(`${Endpoint.GET_ALL_MARKETS}?${params.toString()}`);
      return response.data; // { data: Market[], pagination: Pagination }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch markets");
    }
  }
);

// Get Filter Options (for dropdowns)
export const getMarketFiltersThunk = createAsyncThunk(
  "markets/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Request.get(Endpoint.GET_MARKET_FILTERS);
      return response.data; // { marketNames: [], areas: [], ... }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to load filters");
    }
  }
);

// Update Market
export const updateMarketThunk = createAsyncThunk(
  "markets/update",
  async ({ id, updateData }: { id: string; updateData: Partial<Market> }, { rejectWithValue }) => {
    try {
      const response = await marketService.updateMarket(id, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update market");
    }
  }
);

// Delete Market
export const deleteMarketThunk = createAsyncThunk(
  "markets/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await marketService.deleteMarket(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete market");
    }
  }
);

// Bulk Upload
export const bulkCreateMarketsThunk = createAsyncThunk(
  "markets/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await Request.post(Endpoint.BULK_UPLOAD_MARKETS, formData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Bulk upload failed");
    }
  }
);

// Slice
const marketsSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setMarketFilters: (state, action: PayloadAction<Partial<MarketFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearMarketFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        search: "",
      };
    },
    clearError(state) {
      state.error = null;
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      
      // Get Filter Options
      .addCase(getMarketFiltersThunk.fulfilled, (state, action: PayloadAction<AvailableFilters>) => {
        state.availableFilters = action.payload;
      })

      // Create Market
      .addCase(createMarketThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createMarketThunk.fulfilled, (state, action: PayloadAction<Market>) => {
        state.operationLoading = false;
        state.markets.unshift(action.payload);
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
      .addCase(getAllMarketsThunk.fulfilled, (state, action: PayloadAction<{ data: Market[]; pagination: Pagination }>) => {
        state.loading = false;
        state.markets = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllMarketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Market
      .addCase(updateMarketThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateMarketThunk.fulfilled, (state, action: PayloadAction<Market>) => {
        state.operationLoading = false;
        const index = state.markets.findIndex(m => m._id === action.payload._id);
        if (index !== -1) state.markets[index] = action.payload;
      })
      .addCase(updateMarketThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Delete Market
      .addCase(deleteMarketThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(deleteMarketThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.operationLoading = false;
        state.markets = state.markets.filter(m => m._id !== action.payload);
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
      .addCase(bulkCreateMarketsThunk.fulfilled, (state, action: PayloadAction<Market[]>) => {
        state.loading = false;
        state.markets = [...state.markets, ...action.payload];
      })
      .addCase(bulkCreateMarketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setMarketFilters, clearMarketFilters, clearError } = marketsSlice.actions;
export default marketsSlice.reducer;