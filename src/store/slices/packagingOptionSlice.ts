import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { packagingOptionService, PackagingOption, ApiResponse } from '@/services/packagingOption.service';
import { authService } from '@/services/auth.service';
import axios from 'axios';
import Endpoint from '@/API/apiConfig';

// Async thunks
export const createPackagingOptionThunk = createAsyncThunk(
  'packagingOptions/create',
  async (packagingData: Omit<PackagingOption, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await packagingOptionService.createPackagingOption(packagingData);
      if (response && response) {
        return response;
      } else {
        return rejectWithValue(response.message || 'Failed to create packaging option');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create packaging option');
    }
  }
);

export const getAllPackagingOptionsThunk = createAsyncThunk(
  'packagingOptions/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await packagingOptionService.getAllPackagingOptions();
      if (response && Array.isArray(response)) {
        return response;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch packaging options');
    }
  }
);

export const updatePackagingOptionThunk = createAsyncThunk(
  'packagingOptions/update',
  async ({ id, updateData }: { id: string; updateData: Partial<PackagingOption> }, { rejectWithValue }) => {
    try {
      const response = await packagingOptionService.updatePackagingOption(id, updateData);
      if (response && response) {
        return response;
      } else {
        return rejectWithValue(response.message || 'Failed to update packaging option');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update packaging option');
    }
  }
);

export const deletePackagingOptionThunk = createAsyncThunk(
  'packagingOptions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await packagingOptionService.deletePackagingOption(id);
      if (response.status === 200) {
        return id; // Return the ID of the deleted item
      } else {
        return rejectWithValue(response.message || 'Failed to delete packaging option');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete packaging option');
    }
  }
);

export const bulkCreatePackagingOptionThunk = createAsyncThunk(
  'packagingOptions/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        Endpoint.BULK_UPLOAD_PACKAGING_OPTION,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      // If your API uses `success` flag
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Bulk create failed');
      }

      console.log(response.data.data, ' response.data.data')
      return response.data.data;

    } catch (error: any) {
      // Check if Axios response contains server error message
      const message =
        error.response?.data?.message || error.message || 'Failed to bulk create options';
      return rejectWithValue(message);
    }
  }
);


interface PackagingOptionsState {
  packagingOptions: PackagingOption[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean; // For create/update/delete operations
  operationError: string | null;
}

const initialState: PackagingOptionsState = {
  packagingOptions: [],
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,
};

const packagingOptionsSlice = createSlice({
  name: 'packagingOptions',
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
      // Create Packaging Option
      .addCase(createPackagingOptionThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(
        createPackagingOptionThunk.fulfilled,
        (state, action: PayloadAction<PackagingOption>) => {
          state.operationLoading = false;
          state.packagingOptions.push(action.payload);
        }
      )
      .addCase(createPackagingOptionThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Get All Packaging Options
      .addCase(getAllPackagingOptionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllPackagingOptionsThunk.fulfilled,
        (state, action: PayloadAction<PackagingOption[]>) => {
          state.loading = false;
          state.packagingOptions = action.payload;
        }
      )
      .addCase(getAllPackagingOptionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.packagingOptions = [];
      })
      // Update Packaging Option
      .addCase(updatePackagingOptionThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(
        updatePackagingOptionThunk.fulfilled,
        (state, action: PayloadAction<PackagingOption>) => {
          state.operationLoading = false;
          const index = state.packagingOptions.findIndex(
            (option) => option._id === action.payload._id
          );
          if (index !== -1) {
            state.packagingOptions[index] = action.payload;
          }
        }
      )
      .addCase(updatePackagingOptionThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Delete Packaging Option
      .addCase(deletePackagingOptionThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(
        deletePackagingOptionThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.operationLoading = false;
          state.packagingOptions = state.packagingOptions.filter(
            (option) => option._id !== action.payload
          );
        }
      )
      .addCase(deletePackagingOptionThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      .addCase(bulkCreatePackagingOptionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreatePackagingOptionThunk.fulfilled, (state, action: any) => {
        state.loading = false;
        state.packagingOptions = [...state.packagingOptions, ...action.payload];
      })
      .addCase(bulkCreatePackagingOptionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearOperationError } = packagingOptionsSlice.actions;
export default packagingOptionsSlice.reducer;