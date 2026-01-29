import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  gsmService,
  Gsm,
  CreateGsm,
  UpdateGsm,
} from '@/services/gsm.service';

export const getAllGsmThunk = createAsyncThunk(
  'gsm/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gsmService.getGsm();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch plies');
    }
  }
);

export const getGsmByIdThunk = createAsyncThunk(
  'gsm/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await gsmService.getGsmById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ply');
    }
  }
);

export const createGsmThunk = createAsyncThunk(
  'gsm/create',
  async (data: CreateGsm, { rejectWithValue }) => {
    try {
      const response = await gsmService.createGsm(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create ply');
    }
  }
);

export const updateGsmThunk = createAsyncThunk(
  'gsm/update',
  async (
    { id, data }: { id: string; data: Partial<UpdateGsm> },
    { rejectWithValue }
  ) => {
    try {
      const response = await gsmService.updateGsm(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update ply');
    }
  }
);

export const deleteGsmThunk = createAsyncThunk(
  'gsm/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await gsmService.deleteGsm(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete gsm');
    }
  }
);

export const bulkCreateGsmThunk = createAsyncThunk(
  'gsm/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await gsmService.bulkCreateGsm(formData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk create plies');
    }
  }
);

interface GsmState {
  gsm: Gsm[];
  singleGsm: Gsm | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: GsmState = {
  gsm: [],
  singleGsm: null,
  loading: false,
  error: null,
  successMessage: null,
};

const gsmSlice = createSlice({
  name: 'gsm',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleGsm(state) {
      state.singleGsm = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllGsmThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllGsmThunk.fulfilled,
        (state, action: PayloadAction<Gsm[]>) => {
          state.loading = false;
          state.gsm = action.payload;
        }
      )
      .addCase(getAllGsmThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.gsm = [];
      })
      .addCase(getGsmByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getGsmByIdThunk.fulfilled,
        (state, action: PayloadAction<Gsm>) => {
          state.loading = false;
          state.singleGsm = action.payload;
          state.successMessage = 'Gsm fetched successfully';
        }
      )
      .addCase(getGsmByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createGsmThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createGsmThunk.fulfilled,
        (state, action: PayloadAction<Gsm>) => {
          state.loading = false;
          state.gsm = [...state.gsm, action.payload];
          state.successMessage = 'Gsm created successfully';
        }
      )
      .addCase(createGsmThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateGsmThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateGsmThunk.fulfilled,
        (state, action: PayloadAction<Gsm>) => {
          state.loading = false;
          state.gsm = state.gsm.map((gsm) =>
            gsm._id === action.payload._id ? action.payload : gsm
          );
          state.successMessage = 'Gsm updated successfully';
          state.error = null;
        }
      )
      .addCase(updateGsmThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteGsmThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteGsmThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.gsm = state.gsm.filter((gsm) => gsm._id !== action.payload);
          state.successMessage = 'Gsm deleted successfully';
        }
      )
      .addCase(deleteGsmThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkCreateGsmThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkCreateGsmThunk.fulfilled,
        (state, action: PayloadAction<Gsm[]>) => {
          state.loading = false;
          state.gsm = [...state.gsm, ...action.payload];
          state.successMessage = 'Bulk gsm created successfully';
        }
      )
      .addCase(bulkCreateGsmThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleGsm } =
  gsmSlice.actions;
export default gsmSlice.reducer;