import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paperGSMService, PaperGSM, ApiResponse } from '@/services/paperGSM.service';
import { authService } from '@/services/auth.service';
import axios from 'axios';
import Endpoint from '@/API/apiConfig';

// Async thunks
export const createPaperGSMThunk = createAsyncThunk(
  'paperGSM/create',
  async (paperGSMData: Omit<PaperGSM, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await paperGSMService.createPaperGSM(paperGSMData);
      if (response && response) {
        return response;
      } else {
        return rejectWithValue(response.message || 'Failed to create Paper GSM');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create Paper GSM');
    }
  }
);

export const getAllPaperGSMThunk = createAsyncThunk(
  'paperGSM/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paperGSMService.getAllPaperGSM();
      if (response && Array.isArray(response)) {
        return response;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Paper GSM');
    }
  }
);

export const updatePaperGSMThunk = createAsyncThunk(
  'paperGSM/update',
  async ({ id, updateData }: { id: string; updateData: Partial<PaperGSM> }, { rejectWithValue }) => {
    try {
      const response = await paperGSMService.updatePaperGSM(id, updateData);
      if (response && response) {
        return response;
      } else {
        return rejectWithValue(response.message || 'Failed to update Paper GSM');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update Paper GSM');
    }
  }
);

export const deletePaperGSMThunk = createAsyncThunk(
  'paperGSM/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await paperGSMService.deletePaperGSM(id);
      if (response.status === 200) {
        return id; // Return the ID of the deleted item
      } else {
        return rejectWithValue(response.message || 'Failed to delete Paper GSM');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete Paper GSM');
    }
  }
);

export const bulkCreatePaperGSMThunk = createAsyncThunk(
  'paperGSM/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        Endpoint.BULK_UPLOAD_PAPER_GSM,
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


interface PaperGSMState {
  paperGSM: PaperGSM[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean; // For create/update/delete operations
  operationError: string | null;
}

const initialState: PaperGSMState = {
  paperGSM: [],
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,
};

const paperGSMSlice = createSlice({
  name: 'paperGSM',
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
      .addCase(createPaperGSMThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(
        createPaperGSMThunk.fulfilled,
        (state, action: PayloadAction<PaperGSM>) => {
          state.operationLoading = false;
          state.paperGSM = [action.payload, ...state.paperGSM];
        }
      )
      .addCase(createPaperGSMThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      .addCase(getAllPaperGSMThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllPaperGSMThunk.fulfilled,
        (state, action: PayloadAction<PaperGSM[]>) => {
          state.loading = false;
          state.paperGSM = action.payload;
        }
      )
      .addCase(getAllPaperGSMThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.paperGSM = [];
      })
      .addCase(updatePaperGSMThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(
        updatePaperGSMThunk.fulfilled,
        (state, action: PayloadAction<PaperGSM>) => {
          state.operationLoading = false;
          const index = state.paperGSM.findIndex(
            (option) => option._id === action.payload._id
          );
          if (index !== -1) {
            state.paperGSM[index] = action.payload;
          }
        }
      )
      .addCase(updatePaperGSMThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Delete Packaging Option
      .addCase(deletePaperGSMThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(
        deletePaperGSMThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.operationLoading = false;
          state.paperGSM = state.paperGSM.filter(
            (option) => option._id !== action.payload
          );
        }
      )
      .addCase(deletePaperGSMThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      .addCase(bulkCreatePaperGSMThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreatePaperGSMThunk.fulfilled, (state, action: any) => {
        state.loading = false;
        state.paperGSM = [...state.paperGSM, ...action.payload];
      })
      .addCase(bulkCreatePaperGSMThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearOperationError } = paperGSMSlice.actions;
export default paperGSMSlice.reducer;