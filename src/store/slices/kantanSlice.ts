import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { kantanService, Kantan } from "@/services/kantan.service";
import { authService } from "@/services/auth.service";
import axios from "axios";
import Endpoint from "@/API/apiConfig";

// ✅ Create Kantan
export const createKantanThunk = createAsyncThunk(
  "kantans/create",
  async (kantanData: Omit<Kantan, "_id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await kantanService.createKantan(kantanData);
      if (response && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create kantan");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create kantan");
    }
  }
);

// ✅ Get All Kantans
export const getAllKantansThunk = createAsyncThunk(
  "kantans/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await kantanService.getAllKantans();
      if (response && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue("Invalid response format: data array not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch kantans");
    }
  }
);

// ✅ Update Kantan
export const updateKantanThunk = createAsyncThunk(
  "kantans/update",
  async ({ id, updateData }: { id: string; updateData: Partial<Kantan> }, { rejectWithValue }) => {
    try {
      const response = await kantanService.updateKantan(id, updateData);
      if (response && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update kantan");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update kantan");
    }
  }
);

// ✅ Delete Kantan
export const deleteKantanThunk = createAsyncThunk(
  "kantans/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await kantanService.deleteKantan(id);
      if (response.success !== false) {
        return id; // Return the deleted kantan ID
      } else {
        return rejectWithValue(response.message || "Failed to delete kantan");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete kantan");
    }
  }
);

// ✅ Bulk Upload Kantans
export const bulkCreateKantansThunk = createAsyncThunk(
  "kantans/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const token = authService.getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await axios.post(Endpoint.BULK_UPLOAD_KANTANS, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (response.data.success === false) {
        throw new Error(response.data.message || "Bulk create failed");
      }

      return response.data.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Failed to bulk create kantans";
      return rejectWithValue(message);
    }
  }
);

interface KantansState {
  kantans: Kantan[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  operationError: string | null;
}

const initialState: KantansState = {
  kantans: [],
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,
};

const kantansSlice = createSlice({
  name: "kantans",
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
      // Create Kantan
      .addCase(createKantanThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createKantanThunk.fulfilled, (state, action: PayloadAction<Kantan>) => {
        state.operationLoading = false;
        state.kantans = [action.payload, ...state.kantans];
      })
      .addCase(createKantanThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Get All Kantans
      .addCase(getAllKantansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllKantansThunk.fulfilled, (state, action: PayloadAction<Kantan[]>) => {
        state.loading = false;
        state.kantans = action.payload;
      })
      .addCase(getAllKantansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.kantans = [];
      })
      // Update Kantan
      .addCase(updateKantanThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(updateKantanThunk.fulfilled, (state, action: PayloadAction<Kantan>) => {
        state.operationLoading = false;
        const index = state.kantans.findIndex((k) => k._id === action.payload._id);
        if (index !== -1) {
          state.kantans[index] = action.payload;
        }
      })
      .addCase(updateKantanThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Delete Kantan
      .addCase(deleteKantanThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(deleteKantanThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.operationLoading = false;
        state.kantans = state.kantans.filter((k) => k._id !== action.payload);
      })
      .addCase(deleteKantanThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Bulk Upload Kantans
      .addCase(bulkCreateKantansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateKantansThunk.fulfilled, (state, action: any) => {
        state.loading = false;
        state.kantans = [...state.kantans, ...action.payload];
      })
      .addCase(bulkCreateKantansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearOperationError } = kantansSlice.actions;
export default kantansSlice.reducer;