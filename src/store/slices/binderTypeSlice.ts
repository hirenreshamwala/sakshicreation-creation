// store/slices/binderTypeSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { binderTypeService } from "@/services/binderType.service";

interface BinderType {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateBinderTypeData {
  name: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface BinderTypeFilters {
  page: number;
  limit: number;
  search: string;
}

interface AvailableFilters {
  binderNames: string[];
}

interface BinderTypeState {
  binderTypes: BinderType[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: Pagination | null;
  filters: BinderTypeFilters;
  availableFilters: AvailableFilters;
}

const initialState: BinderTypeState = {
  binderTypes: [],
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
    binderNames: [],
  },
};

// THUNKS

export const createBinderTypeThunk = createAsyncThunk(
  "binderType/create",
  async (data: CreateBinderTypeData, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.createBinderType(data);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create binder type");
      }
    } catch (error: any) {
      console.error("Create Binder Type Error:", error);
      return rejectWithValue(error.message || "Failed to create binder type");
    }
  }
);
// 1. Get Filter Options (for dropdown)
export const getBinderTypeFiltersThunk = createAsyncThunk(
  "binderType/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.getBinderTypeFilters();
      return response; // { binderNames: string[] }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load filters");
    }
  }
);

// 2. Get All with Pagination + Search + Filter
export const getAllBinderTypesThunk = createAsyncThunk(
  "binderType/getAll",
  async (filters: Partial<BinderTypeFilters & { binderNames?: string[] }> = {}, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.getAllBinderTypes(filters);
      if (response.success) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      }
      return rejectWithValue("Failed to fetch binder types");
    } catch (error: any) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

export const getBinderTypeByIdThunk = createAsyncThunk(
  "binderType/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.getBinderTypeById(id);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Binder type not found");
      }
    } catch (error: any) {
      console.error("Get Binder Type By ID Error:", error);
      return rejectWithValue(error.message || "Failed to fetch binder type");
    }
  }
);

export const updateBinderTypeThunk = createAsyncThunk(
  "binderType/update",
  async ({ id, data }: { id: string; data: Partial<CreateBinderTypeData> }, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.updateBinderType(id, data);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update binder type");
      }
    } catch (error: any) {
      console.error("Update Binder Type Error:", error);
      return rejectWithValue(error.message || "Failed to update binder type");
    }
  }
);

export const deleteBinderTypeThunk = createAsyncThunk(
  "binderType/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.deleteBinderType(id);

      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.message || "Failed to delete binder type");
      }
    } catch (error: any) {
      console.error("Delete Binder Type Error:", error);
      return rejectWithValue(error.message || "Failed to delete binder type");
    }
  }
);

export const bulkCreateBinderTypesThunk = createAsyncThunk(
  "binderType/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.bulkCreateBinderTypes(formData);

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to bulk create binder types");
      }
    } catch (error: any) {
      console.error("Bulk Create Binder Types Error:", error);
      return rejectWithValue(error.message || "Failed to bulk create binder types");
    }
  }
);

// Slice
const binderTypeSlice = createSlice({
  name: "binderType",
  initialState,
  reducers: {
    clearBinderTypeError(state) {
      state.error = null;
    },
    clearBinderTypeSuccessMessage(state) {
      state.successMessage = null;
    },
    setBinderTypeFilters(state, action: PayloadAction<Partial<BinderTypeFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearBinderTypeFilters(state) {
      state.filters = { page: 1, limit: 10, search: "" };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBinderTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBinderTypeThunk.fulfilled, (state, action: PayloadAction<BinderType>) => {
        state.loading = false;
        state.binderTypes = [action.payload, ...state.binderTypes];
        state.successMessage = "Binder type created successfully";
      })
      .addCase(createBinderTypeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllBinderTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBinderTypesThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.binderTypes = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllBinderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // === GET FILTERS ===
      .addCase(getBinderTypeFiltersThunk.fulfilled, (state, action: PayloadAction<AvailableFilters>) => {
        state.availableFilters = action.payload;
      })
      .addCase(getBinderTypeByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBinderTypeByIdThunk.fulfilled, (state, action: PayloadAction<BinderType>) => {
        state.loading = false;
        state.singleBinderType = action.payload;
      })
      .addCase(getBinderTypeByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleBinderType = null;
      })
      .addCase(updateBinderTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBinderTypeThunk.fulfilled, (state, action: PayloadAction<BinderType>) => {
        state.loading = false;
        const index = state.binderTypes.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.binderTypes[index] = action.payload;
        }
        state.singleBinderType = action.payload;
        state.successMessage = "Binder type updated successfully";
      })
      .addCase(updateBinderTypeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteBinderTypeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBinderTypeThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.binderTypes = state.binderTypes.filter((item) => item._id !== action.payload);
        state.successMessage = "Binder type deleted successfully";
      })
      .addCase(deleteBinderTypeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkCreateBinderTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateBinderTypesThunk.fulfilled, (state, action: PayloadAction<BinderType[]>) => {
        state.loading = false;
        state.binderTypes = [...state.binderTypes, ...action.payload];
        state.successMessage = "Bulk binder types created successfully";
      })
      .addCase(bulkCreateBinderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearBinderTypeError,
  clearBinderTypeSuccessMessage,
  setBinderTypeFilters,
  clearBinderTypeFilters,
} = binderTypeSlice.actions;

export default binderTypeSlice.reducer;
