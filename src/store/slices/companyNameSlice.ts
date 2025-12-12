// store/slices/companyNameSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { companyNameService, CompanyName, CreateCompanyNameData, ApiResponse } from "@/services/companyName.service";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface CompanyNameFilters {
  page: number;
  limit: number;
  search: string;
  companyNames?: string[];
  defaults?: string[];
}

interface AvailableFilters {
  companyNames: string[];
  defaults: string[];
  logoStatus: string[];  // ← ADD THIS
}

interface CompanyNameState {
  companyNames: CompanyName[];
  singleCompanyName: CompanyName | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: Pagination | null;
  filters: CompanyNameFilters;
  availableFilters: AvailableFilters;
}

const initialState: CompanyNameState = {
  companyNames: [],
  singleCompanyName: null,
  loading: false,
  error: null,
  successMessage: null,
  pagination: null,
  filters: {
    page: 1,
    limit: 10,
    search: "",
  },
  availableFilters: {
    companyNames: [],
    defaults: ["Yes", "No"], // static for default filter
  },
};

// Thunks (unchanged)
export const createCompanyNameThunk = createAsyncThunk(
  "companyName/create",
  async (data: CreateCompanyNameData, { rejectWithValue }) => {
    try {
      const response = await companyNameService.createCompanyName(data);
      if (response.success) return response.data;
      return rejectWithValue(response.message || "Failed to create company name");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create company name");
    }
  }
);

export const getAllCompanyNamesThunk = createAsyncThunk(
  "companyName/getAll",
  async (filters: Partial<CompanyNameFilters> = {}, { rejectWithValue }) => {
    try {
      const response = await companyNameService.getAllCompanyNames(filters);
      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      }
      return rejectWithValue("Invalid response format");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch company names");
    }
  }
);

export const getCompanyNameFiltersThunk = createAsyncThunk(
  "companyName/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await companyNameService.getCompanyNameFilters();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load filters");
    }
  }
);

export const getCompanyNameByIdThunk = createAsyncThunk(
  "companyName/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await companyNameService.getCompanyNameById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Company name not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch company name");
    }
  }
);

export const updateCompanyNameThunk = createAsyncThunk(
  "companyName/update",
  async ({ id, data }: { id: string; data: Partial<CreateCompanyNameData> }, { rejectWithValue }) => {
    try {
      const response = await companyNameService.updateCompanyName(id, data);
      if (response.success) return response.data;
      return rejectWithValue(response.message || "Failed to update company name");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update company name");
    }
  }
);

export const deleteCompanyNameThunk = createAsyncThunk(
  "companyName/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await companyNameService.deleteCompanyName(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete company name");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete company name");
    }
  }
);

const companyNameSlice = createSlice({
  name: "companyName",
  initialState,
  reducers: {
    clearCompanyNameError(state) {
      state.error = null;
    },
    clearCompanyNameSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleCompanyName(state) {
      state.singleCompanyName = null;
    },
    setCompanyNameFilters(state, action: PayloadAction<Partial<CompanyNameFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCompanyNameFilters(state) {
      state.filters = { page: 1, limit: 10, search: "" };
    },
  },
  extraReducers: (builder) => {
    builder
      // === Create ===
      .addCase(createCompanyNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompanyNameThunk.fulfilled, (state, action: PayloadAction<CompanyName>) => {
        state.loading = false;
        state.companyNames.unshift(action.payload); // Add to top
        state.successMessage = "Company name created successfully";
      })
      .addCase(createCompanyNameThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // === Get All (with pagination & filters) ===
      .addCase(getAllCompanyNamesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCompanyNamesThunk.fulfilled, (state, action: PayloadAction<{ data: CompanyName[]; pagination: Pagination }>) => {
        state.loading = false;
        state.companyNames = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllCompanyNamesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.companyNames = [];
      })

      // === Get Filters ===
    .addCase(getCompanyNameFiltersThunk.fulfilled, (state, action: PayloadAction<AvailableFilters>) => {
  state.availableFilters = {
    companyNames: action.payload.companyNames || [],
    defaults: action.payload.defaults || ["Yes", "No"],
    logoStatus: action.payload.logoStatus || ["Has Logo", "No Logo"],
  };
})
      // === Get By ID ===
      .addCase(getCompanyNameByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompanyNameByIdThunk.fulfilled, (state, action: PayloadAction<CompanyName>) => {
        state.loading = false;
        state.singleCompanyName = action.payload;
      })
      .addCase(getCompanyNameByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // === Update ===
      .addCase(updateCompanyNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompanyNameThunk.fulfilled, (state, action: PayloadAction<CompanyName>) => {
        state.loading = false;
        const index = state.companyNames.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) state.companyNames[index] = action.payload;
        state.singleCompanyName = action.payload;
        state.successMessage = "Company name updated successfully";
      })
      .addCase(updateCompanyNameThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // === Delete ===
      .addCase(deleteCompanyNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompanyNameThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.companyNames = state.companyNames.filter((item) => item._id !== action.payload);
        state.successMessage = "Company name deleted successfully";
      })
      .addCase(deleteCompanyNameThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCompanyNameError,
  clearCompanyNameSuccessMessage,
  clearSingleCompanyName,
  setCompanyNameFilters,
  clearCompanyNameFilters,
} = companyNameSlice.actions;

export default companyNameSlice.reducer;