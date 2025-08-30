import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { companyNameService, CompanyName, CreateCompanyNameData, ApiResponse } from "@/services/companyName.service";

interface CompanyNameState {
  companyNames: CompanyName[];
  singleCompanyName: CompanyName | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: CompanyNameState = {
  companyNames: [],
  singleCompanyName: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

// Create Company Name
export const createCompanyNameThunk = createAsyncThunk(
  "companyName/create",
  async (data: CreateCompanyNameData, { rejectWithValue }) => {
    try {
      const response = await companyNameService.createCompanyName(data);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create company name");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create company name");
    }
  }
);

// Get All Company Names
export const getAllCompanyNamesThunk = createAsyncThunk(
  "companyName/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await companyNameService.getAllCompanyNames();
      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          totalCount: response.data.length,
        };
      } else {
        return rejectWithValue("Invalid response format: company names array not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch company names");
    }
  }
);

// Get Company Name By ID
export const getCompanyNameByIdThunk = createAsyncThunk(
  "companyName/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await companyNameService.getCompanyNameById(id);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Company name not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch company name");
    }
  }
);

// Update Company Name
export const updateCompanyNameThunk = createAsyncThunk(
  "companyName/update",
  async ({ id, data }: { id: string; data: Partial<CreateCompanyNameData> }, { rejectWithValue }) => {
    try {
      const response = await companyNameService.updateCompanyName(id, data);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update company name");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update company name");
    }
  }
);

// Delete Company Name
export const deleteCompanyNameThunk = createAsyncThunk(
  "companyName/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await companyNameService.deleteCompanyName(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.message || "Failed to delete company name");
      }
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
    setCompanyNames(state, action: PayloadAction<CompanyName[]>) {
      state.companyNames = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Company Name
      .addCase(createCompanyNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompanyNameThunk.fulfilled, (state, action: PayloadAction<CompanyName>) => {
        state.loading = false;
        state.companyNames = [action.payload, ...state.companyNames];
        state.successMessage = "Company name created successfully";
        state.error = null;
      })
      .addCase(createCompanyNameThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get All Company Names
      .addCase(getAllCompanyNamesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllCompanyNamesThunk.fulfilled,
        (state, action: PayloadAction<{ data: CompanyName[]; totalCount: number }>) => {
          state.loading = false;
          state.companyNames = action.payload.data;
          state.totalCount = action.payload.totalCount;
          state.error = null;
        }
      )
      .addCase(getAllCompanyNamesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.companyNames = [];
      })

      // Get Company Name By ID
      .addCase(getCompanyNameByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompanyNameByIdThunk.fulfilled, (state, action: PayloadAction<CompanyName>) => {
        state.loading = false;
        state.singleCompanyName = action.payload;
        state.error = null;
      })
      .addCase(getCompanyNameByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleCompanyName = null;
      })

      // Update Company Name
      .addCase(updateCompanyNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompanyNameThunk.fulfilled, (state, action: PayloadAction<CompanyName>) => {
        state.loading = false;
        const index = state.companyNames.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.companyNames[index] = action.payload;
        }
        state.singleCompanyName = action.payload;
        state.successMessage = "Company name updated successfully";
        state.error = null;
      })
      .addCase(updateCompanyNameThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Company Name
      .addCase(deleteCompanyNameThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompanyNameThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.companyNames = state.companyNames.filter((item) => item._id !== action.payload);
        state.successMessage = "Company name deleted successfully";
        state.error = null;
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
  setCompanyNames,
} = companyNameSlice.actions;

export default companyNameSlice.reducer;