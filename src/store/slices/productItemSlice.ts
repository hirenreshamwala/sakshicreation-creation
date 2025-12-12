// store/slices/productItemSlice.ts (update to support pagination and filters)
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { productItemService, ProductItem, CreateProductItemData, ApiResponse } from "@/services/productItem.service";

// Types
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
interface ProductItemFilters {
  page: number;
  limit: number;
  search: string;
  itemNames?: string[];
}
interface AvailableFilters {
  itemNames: string[];
}
interface ProductItemState {
  productItems: ProductItem[];
  singleProductItem: ProductItem | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: Pagination | null;
  filters: ProductItemFilters;
  availableFilters: AvailableFilters;
}

const initialState: ProductItemState = {
  productItems: [],
  singleProductItem: null,
  loading: false,
  error: null,
  successMessage: null,
  pagination: null,
  filters: {
    page: 1,
    limit: 10,
    search: "",
  },
  availableFilters: {
    itemNames: [],
  },
};

// Create Product Item
export const createProductItemThunk = createAsyncThunk(
  "productItem/create",
  async (data: CreateProductItemData, { rejectWithValue }) => {
    try {
      const response = await productItemService.createProductItem(data);
      if (response.success) return response.data;
      return rejectWithValue(response.message || "Failed to create product item");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create product item");
    }
  }
);

// Get All Product Items (Server-side with filters & pagination)
export const getAllProductItemsThunk = createAsyncThunk(
  "productItem/getAll",
  async (filters: Partial<ProductItemFilters> = {}, { rejectWithValue }) => {
    try {
      const response = await productItemService.getAllProductItems(filters);
      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      } else {
        return rejectWithValue("Invalid response format");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product items");
    }
  }
);

// Get Filter Options
export const getProductItemFiltersThunk = createAsyncThunk(
  "productItem/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await productItemService.getProductItemFilters();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load filters");
    }
  }
);

// Get Product Item By ID
export const getProductItemByIdThunk = createAsyncThunk(
  "productItem/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productItemService.getProductItemById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Product item not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product item");
    }
  }
);

// Update Product Item
export const updateProductItemThunk = createAsyncThunk(
  "productItem/update",
  async ({ id, data }: { id: string; data: Partial<CreateProductItemData> }, { rejectWithValue }) => {
    try {
      const response = await productItemService.updateProductItem(id, data);
      if (response.success) return response.data;
      return rejectWithValue(response.message || "Failed to update product item");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update product item");
    }
  }
);

// Delete Product Item
export const deleteProductItemThunk = createAsyncThunk(
  "productItem/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productItemService.deleteProductItem(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete product item");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product item");
    }
  }
);

// Bulk Create
export const bulkCreateProductItemsThunk = createAsyncThunk(
  "productItem/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await productItemService.bulkCreateProductItems(formData);
      if (response.success) return response.data;
      return rejectWithValue(response.message || "Bulk create failed");
    } catch (error: any) {
      return rejectWithValue(error.message || "Bulk create failed");
    }
  }
);

const productItemSlice = createSlice({
  name: "productItem",
  initialState,
  reducers: {
    clearProductItemError(state) {
      state.error = null;
    },
    clearProductItemSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleProductItem(state) {
      state.singleProductItem = null;
    },
    setProductItemFilters(state, action: PayloadAction<Partial<ProductItemFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearProductItemFilters(state) {
      state.filters = {
        page: 1,
        limit: 10,
        search: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createProductItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductItemThunk.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.loading = false;
        state.productItems.unshift(action.payload);
        state.successMessage = "Product item created successfully";
      })
      .addCase(createProductItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get All
      .addCase(getAllProductItemsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllProductItemsThunk.fulfilled, (state, action: PayloadAction<{ data: ProductItem[]; pagination: Pagination }>) => {
        state.loading = false;
        state.productItems = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllProductItemsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.productItems = [];
      })
      // Get Filters
      .addCase(getProductItemFiltersThunk.fulfilled, (state, action: PayloadAction<AvailableFilters>) => {
        state.availableFilters = action.payload;
      })
      // Get By ID
      .addCase(getProductItemByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductItemByIdThunk.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.loading = false;
        state.singleProductItem = action.payload;
      })
      .addCase(getProductItemByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateProductItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductItemThunk.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.loading = false;
        const index = state.productItems.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) state.productItems[index] = action.payload;
        state.singleProductItem = action.payload;
        state.successMessage = "Product item updated successfully";
      })
      .addCase(updateProductItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteProductItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductItemThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.productItems = state.productItems.filter((item) => item._id !== action.payload);
        state.successMessage = "Product item deleted successfully";
      })
      .addCase(deleteProductItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Bulk Create
      .addCase(bulkCreateProductItemsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkCreateProductItemsThunk.fulfilled, (state, action: PayloadAction<ProductItem[]>) => {
        state.loading = false;
        state.productItems = [...action.payload, ...state.productItems];
        state.successMessage = "Bulk create successful";
      })
      .addCase(bulkCreateProductItemsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearProductItemError,
  clearProductItemSuccessMessage,
  clearSingleProductItem,
  setProductItemFilters,
  clearProductItemFilters,
} = productItemSlice.actions;

export default productItemSlice.reducer;