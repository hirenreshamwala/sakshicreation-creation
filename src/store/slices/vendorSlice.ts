// store/slices/vendorSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { vendorService, Vendor } from "@/services/vendor.service";

// Types
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface VendorFilters {
  page: number;
  limit: number;
  search: string;
  companyNames?: string[];
  vendorNames?: string[];
  contactNumbers?: string[];
  whatsappNumbers?: string[];
  gstNumbers?: string[];
  address?: string[];


}

interface AvailableFilters {
  companyNames: string[];
  vendorNames: string[];
  contactNumbers: string[];
  whatsappNumbers: string[];
  gstNumbers: string[];
  address?: string[];
}

interface VendorsState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;     // for create/update/delete/bulk
  operationError: string | null;

  pagination: Pagination | null;
  filters: VendorFilters;
  availableFilters: AvailableFilters;
}

const initialState: VendorsState = {
  vendors: [],
  loading: false,
  error: null,
  operationLoading: false,
  operationError: null,

  pagination: null,
  filters: {
    page: 1,
    limit: 10,
    search: "",
  },
  availableFilters: {
    companyNames: [],
    vendorNames: [],
    contactNumbers: [],
    whatsappNumbers: [],
    gstNumbers: [],
    address: [],
  },
};

// Thunks

export const getAllVendorsThunk = createAsyncThunk(
  "vendors/getAll",
  async (filters: Partial<VendorFilters> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.companyNames?.length) {
        filters.companyNames.forEach((name) =>
          params.append("companyNames", name)
        );
      }
      if (filters.vendorNames?.length) {
        filters.vendorNames.forEach((name) =>
          params.append("vendorNames", name)
        );
      } 
      if (filters.contactNumbers?.length) {
        filters.contactNumbers.forEach((number) =>
          params.append("contactNumbers", number)
        );
      }
      if (filters.whatsappNumbers?.length) {
        filters.whatsappNumbers.forEach((number) =>
          params.append("whatsappNumbers", number)
        );
      }
      if (filters.gstNumbers?.length) {
        filters.gstNumbers.forEach((gst) =>
          params.append("gstNumbers", gst)
        );
      }
      if (filters.address?.length) {
        filters.address.forEach((addr) =>
          params.append("address", addr)
        );
      }
        

      const response = await vendorService.getVendors(params.toString());
      return response; // { data: Vendor[], pagination: Pagination }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch vendors"
      );
    }
  }
);

export const getVendorFiltersThunk = createAsyncThunk(
  "vendors/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await vendorService.getVendorFilters();
      return response; // { companyNames: string[] }
    } catch (error: any) {
      return rejectWithValue("Failed to load filters");
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


// Slice
const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setVendorFilters: (state, action: PayloadAction<Partial<VendorFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearVendorFilters: (state) => {
      state.filters = { page: 1, limit: 10, search: "" };
    },
    clearError(state) {
      state.error = null;
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Vendors (with pagination + filters)
      .addCase(getAllVendorsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllVendorsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllVendorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Filters
      .addCase(getVendorFiltersThunk.fulfilled, (state, action) => {
        state.availableFilters = action.payload;
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

      // Create
      .addCase(createVendorThunk.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
      })
      .addCase(createVendorThunk.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.vendors.unshift(action.payload); // add to top
      })
      .addCase(createVendorThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // Update
      .addCase(updateVendorThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updateVendorThunk.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.vendors.findIndex((v) => v._id === action.payload._id);
        if (index !== -1) state.vendors[index] = action.payload;
      })
      .addCase(updateVendorThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // Delete
      .addCase(deleteVendorThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(deleteVendorThunk.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.vendors = state.vendors.filter((v) => v._id !== action.payload);
      })
      .addCase(deleteVendorThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // Bulk Upload
      .addCase(bulkCreateVendorsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkCreateVendorsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = [...action.payload, ...state.vendors]; // prepend new ones
      })
      .addCase(bulkCreateVendorsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setVendorFilters, clearVendorFilters, clearError } = vendorSlice.actions;
export default vendorSlice.reducer;