import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  vendorService,
  Vendor,
  CreateVendor,
  UpdateVendor,
} from '@/services/vendor.service';

export const getAllVendorsThunk = createAsyncThunk(
  'vendors/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await vendorService.getVendors();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vendors');
    }
  }
);

export const getVendorByIdThunk = createAsyncThunk(
  'vendors/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await vendorService.getVendorById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vendor');
    }
  }
);

export const createVendorThunk = createAsyncThunk(
  'vendors/create',
  async (data: CreateVendor, { rejectWithValue }) => {
    try {
      const response = await vendorService.createVendor(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create vendor');
    }
  }
);

export const updateVendorThunk = createAsyncThunk(
  'vendors/update',
  async (
    { id, data }: { id: string; data: Partial<UpdateVendor> },
    { rejectWithValue }
  ) => {
    try {
      const response = await vendorService.updateVendor(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update vendor');
    }
  }
);

export const deleteVendorThunk = createAsyncThunk(
  'vendors/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await vendorService.deleteVendor(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete vendor');
    }
  }
);

export const bulkCreateVendorsThunk = createAsyncThunk(
  'vendors/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await vendorService.bulkCreateVendors(formData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk create vendors');
    }
  }
);

interface VendorState {
  vendors: Vendor[];
  singleVendor: Vendor | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: VendorState = {
  vendors: [],
  singleVendor: null,
  loading: false,
  error: null,
  successMessage: null,
};

const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleVendor(state) {
      state.singleVendor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllVendorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllVendorsThunk.fulfilled,
        (state, action: PayloadAction<Vendor[]>) => {
          state.loading = false;
          state.vendors = action.payload;
        }
      )
      .addCase(getAllVendorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.vendors = [];
      })
      .addCase(getVendorByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getVendorByIdThunk.fulfilled,
        (state, action: PayloadAction<Vendor>) => {
          state.loading = false;
          state.singleVendor = action.payload;
          state.successMessage = 'Vendor fetched successfully';
        }
      )
      .addCase(getVendorByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createVendorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createVendorThunk.fulfilled,
        (state, action: PayloadAction<Vendor>) => {
          state.loading = false;
          state.vendors = [...state.vendors, action.payload];
          state.successMessage = 'Vendor created successfully';
        }
      )
      .addCase(createVendorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateVendorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateVendorThunk.fulfilled,
        (state, action: PayloadAction<Vendor>) => {
          state.loading = false;
          state.vendors = state.vendors.map((vendor) =>
            vendor._id === action.payload._id ? action.payload : vendor
          );
          state.successMessage = 'Vendor updated successfully';
          state.error = null;
        }
      )
      .addCase(updateVendorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteVendorThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteVendorThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.vendors = state.vendors.filter(
            (vendor) => vendor._id !== action.payload
          );
          state.successMessage = 'Vendor deleted successfully';
        }
      )
      .addCase(deleteVendorThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkCreateVendorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkCreateVendorsThunk.fulfilled,
        (state, action: PayloadAction<Vendor[]>) => {
          state.loading = false;
          state.vendors = [...state.vendors, ...action.payload];
          state.successMessage = 'Bulk vendors created successfully';
        }
      )
      .addCase(bulkCreateVendorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleVendor } =
  vendorSlice.actions;
export default vendorSlice.reducer;