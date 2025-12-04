import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { kantanService, Kantan } from "@/services/kantan.service";
import Endpoint from "@/API/apiConfig";
import Request from "@/services/axios";

// Types
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface KantanFilters {
  page: number;
  limit: number;
  search: string;
  kantanNames?: string[];
}

interface AvailableFilters {
  kantanNames: string[];
}

interface KantansState {
  kantans: Kantan[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  operationError: string | null;

  // Server-side state
  pagination: Pagination | null;
  filters: KantanFilters;
  availableFilters: AvailableFilters;
}

const initialState: KantansState = {
  kantans: [],
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
    kantanNames: [],
  },
};

// Create Kantan (unchanged)
export const createKantanThunk = createAsyncThunk(
  "kantans/create",
  async (kantanData: Omit<Kantan, "_id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await kantanService.createKantan(kantanData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create kantan");
    }
  }
);

// Get All Kantans - NOW SUPPORTS PAGINATION + FILTERS
export const getAllKantansThunk = createAsyncThunk(
  "kantans/getAll",
  async (filters: Partial<KantanFilters> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.kantanNames?.length) {
        filters.kantanNames.forEach((name) => params.append("kantanNames", name));
      }

      const response = await Request.get(`${Endpoint.GET_ALL_KANTANS}?${params.toString()}`);
      return response.data; // Expected: { data: Kantan[], pagination: Pagination }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch kantans");
    }
  }
);

// Get Filter Options (for dropdown)
export const getKantanFiltersThunk = createAsyncThunk(
  "kantans/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Request.get(Endpoint.GET_KANTAN_FILTERS);
      return response.data; // { kantanNames: string[] }
    } catch (error: any) {
      return rejectWithValue("Failed to load filters");
    }
  }
);

// Update Kantan (unchanged)
export const updateKantanThunk = createAsyncThunk(
  "kantans/update",
  async ({ id, updateData }: { id: string; updateData: Partial<Kantan> }, { rejectWithValue }) => {
    try {
      const response = await kantanService.updateKantan(id, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update kantan");
    }
  }
);

// Delete Kantan (unchanged)
export const deleteKantanThunk = createAsyncThunk(
  "kantans/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await kantanService.deleteKantan(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete kantan");
    }
  }
);

// Bulk Upload (unchanged)
export const bulkCreateKantansThunk = createAsyncThunk(
  "kantans/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await Request.post(Endpoint.BULK_UPLOAD_KANTANS, formData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Bulk upload failed");
    }
  }
);

const kantansSlice = createSlice({
  name: "kantans",
  initialState,
  reducers: {
    setKantanFilters: (state, action: PayloadAction<Partial<KantanFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearKantanFilters: (state) => {
      state.filters = { page: 1, limit: 10, search: "" };
    },
    clearError(state) {
      state.error = null;
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Kantans (with pagination & filters)
      .addCase(getAllKantansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllKantansThunk.fulfilled, (state, action: PayloadAction<{ data: Kantan[]; pagination: Pagination }>) => {
        state.loading = false;
        state.kantans = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllKantansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Filter Options
      .addCase(getKantanFiltersThunk.fulfilled, (state, action: PayloadAction<AvailableFilters>) => {
        state.availableFilters = action.payload;
      })

      // Create Kantan
      .addCase(createKantanThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createKantanThunk.fulfilled, (state, action: PayloadAction<Kantan>) => {
        state.operationLoading = false;
        state.kantans.unshift(action.payload);
      })
      .addCase(createKantanThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // Update Kantan
      .addCase(updateKantanThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateKantanThunk.fulfilled, (state, action: PayloadAction<Kantan>) => {
        state.operationLoading = false;
        const index = state.kantans.findIndex((k) => k._id === action.payload._id);
        if (index !== -1) state.kantans[index] = action.payload;
      })
      .addCase(updateKantanThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // Delete Kantan
      .addCase(deleteKantanThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(deleteKantanThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.operationLoading = false;
        state.kantans = state.kantans.filter((k) => k._id !== action.payload);
      })
      .addCase(deleteKantanThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // Bulk Upload
      .addCase(bulkCreateKantansThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkCreateKantansThunk.fulfilled, (state, action: PayloadAction<Kantan[]>) => {
        state.loading = false;
        state.kantans = [...action.payload, ...state.kantans];
      })
      .addCase(bulkCreateKantansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setKantanFilters, clearKantanFilters, clearError } = kantansSlice.actions;
export default kantansSlice.reducer;