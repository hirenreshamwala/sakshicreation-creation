import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  deckalService,
  Deckal,
  CreateDeckal,
  UpdateDeckal,
} from '@/services/deckal.service';

export const getAllDeckalsThunk = createAsyncThunk(
  'deckals/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await deckalService.getDeckals();
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

export const getDeckalByIdThunk = createAsyncThunk(
  'deckals/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await deckalService.getDeckalById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch deckal');
    }
  }
);

export const createDeckalThunk = createAsyncThunk(
  'deckals/create',
  async (data: CreateDeckal, { rejectWithValue }) => {
    try {
      const response = await deckalService.createDeckal(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create deckal');
    }
  }
);

export const updateDeckalThunk = createAsyncThunk(
  'deckals/update',
  async (
    { id, data }: { id: string; data: Partial<UpdateDeckal> },
    { rejectWithValue }
  ) => {
    try {
      const response = await deckalService.updateDeckal(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update deckal');
    }
  }
);

export const deleteDeckalThunk = createAsyncThunk(
  'deckals/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await deckalService.deleteDeckal(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete deckal');
    }
  }
);

interface DeckalState {
  deckals: Deckal[];
  singleDeckal: Deckal | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: DeckalState = {
  deckals: [],
  singleDeckal: null,
  loading: false,
  error: null,
  successMessage: null,
};

const deckalSlice = createSlice({
  name: 'deckals',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleDeckal(state) {
      state.singleDeckal = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllDeckalsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllDeckalsThunk.fulfilled,
        (state, action: PayloadAction<Deckal[]>) => {
          state.loading = false;
          state.deckals = action.payload;
        }
      )
      .addCase(getAllDeckalsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.deckals = [];
      })
      .addCase(getDeckalByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getDeckalByIdThunk.fulfilled,
        (state, action: PayloadAction<Deckal>) => {
          state.loading = false;
          state.singleDeckal = action.payload;
          state.successMessage = 'Deckal fetched successfully';
        }
      )
      .addCase(getDeckalByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDeckalThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createDeckalThunk.fulfilled,
        (state, action: PayloadAction<Deckal>) => {
          state.loading = false;
          state.deckals = [...state.deckals, action.payload];
          state.successMessage = 'Deckal created successfully';
        }
      )
      .addCase(createDeckalThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDeckalThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateDeckalThunk.fulfilled,
        (state, action: PayloadAction<Deckal>) => {
          state.loading = false;
          state.deckals = state.deckals.map((deckal) =>
            deckal._id === action.payload._id ? action.payload : deckal
          );
          state.successMessage = 'Deckal updated successfully';
          state.error = null;
        }
      )
      .addCase(updateDeckalThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDeckalThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteDeckalThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.deckals = state.deckals.filter((deckal) => deckal._id !== action.payload);
          state.successMessage = 'Deckal deleted successfully';
        }
      )
      .addCase(deleteDeckalThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleDeckal } =
  deckalSlice.actions;
export default deckalSlice.reducer;