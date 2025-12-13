import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
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

interface BinderTypeState {
  binderTypes: BinderType[];
  singleBinderType: BinderType | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: BinderTypeState = {
  binderTypes: [],
  singleBinderType: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

// Thunks
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

export const getAllBinderTypesThunk = createAsyncThunk(
  "binderType/getAll",
  async (params?: { page?: number; limit?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await binderTypeService.getAllBinderTypes(params);

      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          totalCount: response.totalCount || response.data.length,
        };
      } else {
        return rejectWithValue("Invalid response format: binder types array not found");
      }
    } catch (error: any) {
      console.error("Get All Binder Types Error:", error);
      return rejectWithValue(error.message || "Failed to fetch binder types");
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
    clearSingleBinderType(state) {
      state.singleBinderType = null;
    },
    setBinderTypes(state, action: PayloadAction<BinderType[]>) {
      state.binderTypes = action.payload;
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
      .addCase(
        getAllBinderTypesThunk.fulfilled,
        (state, action: PayloadAction<{ data: BinderType[]; totalCount: number }>) => {
          state.loading = false;
          state.binderTypes = action.payload.data;
          state.totalCount = action.payload.totalCount;
        }
      )
      .addCase(getAllBinderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.binderTypes = [];
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
  clearSingleBinderType,
  setBinderTypes,
} = binderTypeSlice.actions;

export default binderTypeSlice.reducer;
