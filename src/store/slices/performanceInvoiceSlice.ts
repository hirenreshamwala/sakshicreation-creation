import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { performanceInvoiceService, PerformanceInvoice, CreatePerformanceInvoice, Order } from "@/services/performanceInvoice.service";

export const getAllPerformanceInvoicesThunk = createAsyncThunk(
  "performanceInvoices/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await performanceInvoiceService.getPerformanceInvoices();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue("Invalid response format: data array not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch performance invoices");
    }
  }
);

export const getPerformanceInvoiceByIdThunk = createAsyncThunk(
  "performanceInvoices/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await performanceInvoiceService.getPerformanceInvoiceById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch performance invoice");
    }
  }
);

export const createPerformanceInvoiceThunk = createAsyncThunk(
  "performanceInvoices/create",
  async (data: CreatePerformanceInvoice, { rejectWithValue }) => {
    try {
      const response = await performanceInvoiceService.createPerformanceInvoice(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create performance invoice");
    }
  }
);

export const updatePerformanceInvoiceThunk = createAsyncThunk(
  "performanceInvoices/update",
  async ({ id, data }: { id: string; data: Partial<CreatePerformanceInvoice> }, { rejectWithValue }) => {
    try {
      const response = await performanceInvoiceService.updatePerformanceInvoice(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update performance invoice");
    }
  }
);

export const deletePerformanceInvoiceThunk = createAsyncThunk(
  "performanceInvoices/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await performanceInvoiceService.deletePerformanceInvoice(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete performance invoice");
    }
  }
);

export const getAllOrdersThunk = createAsyncThunk(
  "performanceInvoices/getAllOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await performanceInvoiceService.getAllOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue("Invalid response format: data array not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

export const getOrderByOrderNumberThunk = createAsyncThunk(
  "performanceInvoices/getOrderByOrderNumber",
  async (orderNumber: string, { rejectWithValue }) => {
    try {
      const response = await performanceInvoiceService.getOrderByOrderNumber(orderNumber);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch order");
    }
  }
);

export interface PerformanceInvoice {
  _id: string;
  orderNumber: string;
  companyName: string;
  party: {
    _id: string;
    partyName: string;
    GSTNo?: string;
    address?: {
      unitNo?: string;
      streetAddress?: string;
      marketName?: string;
      landMark?: string;
      area?: string;
      postalCode?: string;
    };
  };
  quantity: number;
  color?: string;
  size?: string;
  GSTNo?: string;
  partyAddress?: {
    unitNo?: string;
    streetAddress?: string;
    marketName?: string;
    landMark?: string;
    area?: string;
    postalCode?: string;
  };
  servicePerformance: string;
  createdAt: string;
  updatedAt: string;
  daysAfterConfirmation?: number;
}

export interface CreatePerformanceInvoice {
  orderNumber: string;
  companyName: string;
  partyName: string;
  quantity: number;
  color?: string;
  size?: string;
  GSTNo?: string;
  partyAddress?: {
    unitNo?: string;
    streetAddress?: string;
    marketName?: string;
    landMark?: string;
    area?: string;
    postalCode?: string;
  };
  servicePerformance: string;
  daysAfterConfirmation?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  companyName: {
    _id: string;
    name: string;
  };
  party: {
    _id: string;
    partyName: string;
    GSTNo?: string;
    address?: {
      unitNo?: string;
      streetAddress?: string;
      marketName?: string;
      landMark?: string;
      area?: string;
      postalCode?: string;
    };
  };
  productItem: {
    _id: string;
    itemName: string;
    color?: string;
    size?: string;
  };
  qty: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface PerformanceInvoiceState {
  performanceInvoices: PerformanceInvoice[];
  singlePerformanceInvoice: PerformanceInvoice | null;
  orders: Order[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: PerformanceInvoiceState = {
  performanceInvoices: [],
  singlePerformanceInvoice: null,
  orders: [],
  loading: false,
  error: null,
  successMessage: null,
};

const performanceInvoiceSlice = createSlice({
  name: "performanceInvoices",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPerformanceInvoicesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPerformanceInvoicesThunk.fulfilled, (state, action: PayloadAction<PerformanceInvoice[]>) => {
        state.loading = false;
        state.performanceInvoices = action.payload;
      })
      .addCase(getAllPerformanceInvoicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.performanceInvoices = [];
      })
      .addCase(getPerformanceInvoiceByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPerformanceInvoiceByIdThunk.fulfilled, (state, action: PayloadAction<PerformanceInvoice>) => {
        state.loading = false;
        state.singlePerformanceInvoice = action.payload;
        state.successMessage = "Performance invoice fetched successfully";
      })
      .addCase(getPerformanceInvoiceByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPerformanceInvoiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPerformanceInvoiceThunk.fulfilled, (state, action: PayloadAction<PerformanceInvoice>) => {
        state.loading = false;
        state.performanceInvoices = [...state.performanceInvoices, action.payload];
        state.successMessage = "Performance invoice created successfully";
      })
      .addCase(createPerformanceInvoiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePerformanceInvoiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePerformanceInvoiceThunk.fulfilled, (state, action: PayloadAction<PerformanceInvoice>) => {
        state.loading = false;
        state.performanceInvoices = state.performanceInvoices.map((invoice) =>
          invoice._id === action.payload._id ? action.payload : invoice
        );
        state.successMessage = "Performance invoice updated successfully";
      })
      .addCase(updatePerformanceInvoiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase (deletePerformanceInvoiceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePerformanceInvoiceThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.performanceInvoices = state.performanceInvoices.filter((invoice) => invoice._id !== action.payload);
        state.successMessage = "Performance invoice deleted successfully";
      })
      .addCase(deletePerformanceInvoiceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOrdersThunk.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(getAllOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getOrderByOrderNumberThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderByOrderNumberThunk.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        state.successMessage = "Order fetched successfully";
      })
      .addCase(getOrderByOrderNumberThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage } = performanceInvoiceSlice.actions;
export default performanceInvoiceSlice.reducer;