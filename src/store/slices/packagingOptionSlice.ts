// store/slices/packagingOptionSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import Request from "@/services/axios";
import Endpoint from "@/API/apiConfig";
import { packagingOptionService } from "@/services/packagingOption.service";

// Types
export interface PackagingOption {
  _id: string;
  party: { _id: string; partyName: string } | string;
  ply: string;
  length: string;
  width: string;
  height: string;
  deckal: string;
  paper1GSM: string;
  paper2GSM: string;
  paper3GSM: string;
  noOfPieces?: string;
  ratePerPiece?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Filters {
  page: number;
  limit: number;
  search: string;
  parties?: string[];   // array of party _id
  plys?: string[];      // array of ply values like "5", "7"
  lengths?: string;
  widths?: string;
  heights?: string;
  deckals?: string;
  paper1GSMs?: string;
  paper2GSMs?: string;
  paper3GSMs?: string;
  noOfPieces?: string;
  ratePerPiece?: string;
  dates?: string;

}

interface AvailableFilters {
  parties: string[];    // party names for dropdown
  plys: string[];       // unique ply values
  lengths?: string[];
  widths?: string[];
  heights?: string[];
  deckals?: string[];
  paper1GSMs?: string[];
  paper2GSMs?: string[];
  paper3GSMs?: string[];  
  noOfPiecesOptions?: string[];
  ratePerPieceOptions?: string[];
  dates?: string[];
}

interface PackagingOptionsState {
  packagingOptions: PackagingOption[];
  loading: boolean;
  error: string | null;
  operationLoading: boolean;
  operationError: string | null;

  // Server-side state
  pagination: Pagination | null;
  filters: Filters;
  availableFilters: AvailableFilters;
}

const initialState: PackagingOptionsState = {
  packagingOptions: [],
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
    parties: [],
    plys: [],
  lengths: [],
  widths: [],
  heights: [],
  deckals: [],
  paper1GSMs: [],
  paper2GSMs: [],
  paper3GSMs: [],
  noOfPiecesOptions: [],
  ratePerPieceOptions: [],
  dates: []
  
  },
};

// Thunks

export const getAllPackagingOptionsThunk = createAsyncThunk(
  "packagingOptions/getAll",
  async (filters: Partial<Filters> = {}, { rejectWithValue }) => {
    console.log("🚀 ~ filters:", filters)
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      filters.parties?.forEach((id) => params.append("parties", id));
      filters.plys?.forEach((ply) => params.append("plys", ply));
      if (filters.lengths) params.append("lengths", filters.lengths);
      if (filters.widths) params.append("widths", filters.widths);
      if (filters.heights) params.append("heights", filters.heights);
      if (filters.deckals) params.append("deckals", filters.deckals);
      if (filters.paper1GSMs) params.append("paper1GSMs", filters.paper1GSMs);
      if (filters.paper2GSMs) params.append("paper2GSMs", filters.paper2GSMs);
      if (filters.paper3GSMs) params.append("paper3GSMs", filters.paper3GSMs);
      if (filters.noOfPieces) params.append("noOfPieces", filters.noOfPieces);
      if (filters.ratePerPiece) params.append("ratePerPiece", filters.ratePerPiece);
      if (filters.dates) params.append("dates", filters.dates);

      const response = await Request.get(
        `${Endpoint.GET_ALL_PACKAGING_OPTION}?${params.toString()}`
      );

      return response.data; // Expected: { data: PackagingOption[], pagination: Pagination }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch packaging options"
      );
    }
  }
);

export const getPackagingFiltersThunk = createAsyncThunk(
  "packagingOptions/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Request.get(Endpoint.GET_PACKAGING_FILTERS);
      return response.data; // { parties: string[], plys: string[] }
    } catch (error: any) {
      return rejectWithValue("Failed to load filters");
    }
  }
);

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

      const response = await Request.post(
        Endpoint.BULK_UPLOAD_PACKAGING_OPTION,
        formData);

      // If your API uses `success` flag
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Bulk create failed');
      }

      // console.log(response.data.data, ' response.data.data')
      return response.data;

    } catch (error: any) {
      // Check if Axios response contains server error message
      const message =
        error.response?.data?.message || error.message || 'Failed to bulk create options';
      return rejectWithValue(message);
    }
  }
);
// Slice
const packagingOptionsSlice = createSlice({
  name: "packagingOptions",
  initialState,
  reducers: {
    setPackagingFilters: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearPackagingFilters: (state) => {
      state.filters = { page: 1, limit: 10, search: "" };
    },
    clearError(state) {
      state.error = null;
      state.operationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Packaging Option
      .addCase(createPackagingOptionThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(createPackagingOptionThunk.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.packagingOptions.unshift(action.payload);
      })
      .addCase(createPackagingOptionThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })
      // Get All Packaging Options
      .addCase(getAllPackagingOptionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPackagingOptionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.packagingOptions = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllPackagingOptionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // === FILTERS (Party & Ply dropdown) ===
      .addCase(getPackagingFiltersThunk.fulfilled, (state, action) => {
        state.availableFilters = action.payload;
      })
      // === UPDATE ===
      .addCase(updatePackagingOptionThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(updatePackagingOptionThunk.fulfilled, (state, action) => {
        state.operationLoading = false;
        const idx = state.packagingOptions.findIndex((item) => item._id === action.payload._id);
        if (idx !== -1) state.packagingOptions[idx] = action.payload;
      })
      .addCase(updatePackagingOptionThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // === DELETE ===
      .addCase(deletePackagingOptionThunk.pending, (state) => {
        state.operationLoading = true;
      })
      .addCase(deletePackagingOptionThunk.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.packagingOptions = state.packagingOptions.filter((item) => item._id !== action.payload);
      })
      .addCase(deletePackagingOptionThunk.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload as string;
      })

      // === BULK UPLOAD ===
      .addCase(bulkCreatePackagingOptionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkCreatePackagingOptionThunk.fulfilled, (state, action) => {
        state.loading = false;
        // If you want to refresh list after bulk, better to re-fetch via getAll
        // Or prepend new ones if API returns them
        if (action.payload.data?.length) {
          state.packagingOptions = [...action.payload.data, ...state.packagingOptions];
        }
      })
      .addCase(bulkCreatePackagingOptionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPackagingFilters, clearPackagingFilters, clearError } = packagingOptionsSlice.actions;
export default packagingOptionsSlice.reducer;