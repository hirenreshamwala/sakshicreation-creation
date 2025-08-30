import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { productItemService } from "@/services/productItem.service";

interface ProductItem {
  _id: string;
  itemName: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateProductItemData {
  itemName: string;
}

interface ProductItemState {
  productItems: ProductItem[];
  singleProductItem: ProductItem | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: ProductItemState = {
  productItems: [],
  singleProductItem: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

export const createProductItemThunk = createAsyncThunk(
  "productItem/create",
  async (data: CreateProductItemData, { rejectWithValue }) => {
    try {
      const response = await productItemService.createProductItem(data);
      console.log("Create Product Item Response:", response);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create product item");
      }
    } catch (error: any) {
      console.error("Create Product Item Error:", error);
      return rejectWithValue(error.message || "Failed to create product item");
    }
  }
);

export const getAllProductItemsThunk = createAsyncThunk(
  "productItem/getAll",
  async (params?: { page?: number; limit?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await productItemService.getAllProductItems(params);
      console.log("Get All Product Items Response:", response);

      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          totalCount: response.totalCount || response.data.length,
        };
      } else {
        return rejectWithValue("Invalid response format: product items array not found");
      }
    } catch (error: any) {
      console.error("Get All Product Items Error:", error);
      return rejectWithValue(error.message || "Failed to fetch product items");
    }
  }
);

export const getProductItemByIdThunk = createAsyncThunk(
  "productItem/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productItemService.getProductItemById(id);
      console.log("Get Product Item By ID Response:", response);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Product item not found");
      }
    } catch (error: any) {
      console.error("Get Product Item By ID Error:", error);
      return rejectWithValue(error.message || "Failed to fetch product item");
    }
  }
);

export const updateProductItemThunk = createAsyncThunk(
  "productItem/update",
  async ({ id, data }: { id: string; data: Partial<CreateProductItemData> }, { rejectWithValue }) => {
    try {
      const response = await productItemService.updateProductItem(id, data);
      console.log("Update Product Item Response:", response);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update product item");
      }
    } catch (error: any) {
      console.error("Update Product Item Error:", error);
      return rejectWithValue(error.message || "Failed to update product item");
    }
  }
);

export const deleteProductItemThunk = createAsyncThunk(
  "productItem/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productItemService.deleteProductItem(id);
      console.log("Delete Product Item Response:", response);

      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.message || "Failed to delete product item");
      }
    } catch (error: any) {
      console.error("Delete Product Item Error:", error);
      return rejectWithValue(error.message || "Failed to delete product item");
    }
  }
);

export const bulkCreateProductItemsThunk = createAsyncThunk(
  "productItem/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await productItemService.bulkCreateProductItems(formData);
      console.log("Bulk Create Product Items Response:", response);

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to bulk create product items");
      }
    } catch (error: any) {
      console.error("Bulk Create Product Items Error:", error);
      return rejectWithValue(error.message || "Failed to bulk create product items");
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
    setProductItems(state, action: PayloadAction<ProductItem[]>) {
      state.productItems = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProductItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductItemThunk.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.loading = false;
        state.productItems = [action.payload, ...state.productItems];
        state.successMessage = "Product item created successfully";
        state.error = null;
      })
      .addCase(createProductItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllProductItemsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllProductItemsThunk.fulfilled,
        (state, action: PayloadAction<{ data: ProductItem[]; totalCount: number }>) => {
          state.loading = false;
          state.productItems = action.payload.data;
          state.totalCount = action.payload.totalCount;
          state.error = null;
        }
      )
      .addCase(getAllProductItemsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.productItems = [];
      })
      .addCase(getProductItemByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductItemByIdThunk.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.loading = false;
        state.singleProductItem = action.payload;
        state.error = null;
      })
      .addCase(getProductItemByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleProductItem = null;
      })
      .addCase(updateProductItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductItemThunk.fulfilled, (state, action: PayloadAction<ProductItem>) => {
        state.loading = false;
        const index = state.productItems.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          state.productItems[index] = action.payload;
        }
        state.singleProductItem = action.payload;
        state.successMessage = "Product item updated successfully";
        state.error = null;
      })
      .addCase(updateProductItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteProductItemThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductItemThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.productItems = state.productItems.filter((item) => item._id !== action.payload);
        state.successMessage = "Product item deleted successfully";
        state.error = null;
      })
      .addCase(deleteProductItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkCreateProductItemsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateProductItemsThunk.fulfilled, (state, action: PayloadAction<ProductItem[]>) => {
        state.loading = false;
        state.productItems = [...state.productItems, ...action.payload];
        state.successMessage = "Bulk product items created successfully";
        state.error = null;
      })
      .addCase(bulkCreateProductItemsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProductItemError, clearProductItemSuccessMessage, clearSingleProductItem, setProductItems } =
  productItemSlice.actions;

export default productItemSlice.reducer;