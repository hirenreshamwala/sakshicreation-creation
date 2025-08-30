import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { orderService } from "@/services/order.service";

interface Order {
  _id: string;
  orderNumber: string;
  companyName: {
    _id: string;
    companyName: string;
  };
  party: {
    _id: string;
    partyName: string;
    contactPerson?: string;
    personWhatsAppNo?: string;
    GSTNo?: string;
  };
  productItem: {
    _id: string;
    itemName: string;
  };
  qty: number;
  remarks: string;
  filePaths: string[]; // केवल file paths store करेंगे
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
interface PaperField {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
}
interface CreateOrderData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  filePaths?: string[]; // केवल paths
  createdBy?: string;
}

interface OrderState {
  orders: Order[];
  singleOrder: Order | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const initialState: OrderState = {
  orders: [],
  singleOrder: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};

// Create Order
export const createOrderThunk = createAsyncThunk(
  "order/create",
  async (data: CreateOrderData, { rejectWithValue }) => {
    try {
      console.log("Redux: Creating order with data:", data);
      const response = await orderService.createOrder(data);
      console.log("Redux: Create order response:", response);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Redux: Create order error:", error);
      return rejectWithValue(error.message || "Failed to create order");
    }
  }
);

// Get All Orders
export const getAllOrdersThunk = createAsyncThunk(
  "order/getAll",
  async (
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      companyName?: string;
      party?: string;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.getAllOrders(params);
      console.log("Redux: Get all orders response:", response);

      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      } else {
        return rejectWithValue(
          "Invalid response format: orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get all orders error:", error);
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

// Get Order By ID
export const getOrderByIdThunk = createAsyncThunk(
  "order/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);
      console.log("Redux: Get order by ID response:", response);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Order not found");
      }
    } catch (error: any) {
      console.error("Redux: Get order by ID error:", error);
      return rejectWithValue(error.message || "Failed to fetch order");
    }
  }
);

// Update Order
export const updateOrderThunk = createAsyncThunk(
  "order/update",
  async (
    { id, data }: { id: string; data: Partial<CreateOrderData & {
      printerPapers?: PaperField[];
      binderPapers?: PaperField[];
      bookletPapers?: PaperField[];
    }> },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.updateOrder(id, data);
      console.log("Redux: Update order response:", response);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Redux: Update order error:", error);
      return rejectWithValue(error.message || "Failed to update order");
    }
  }
);

// Delete Order
export const deleteOrderThunk = createAsyncThunk(
  "order/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.deleteOrder(id);
      console.log("Redux: Delete order response:", response);

      if (response.success) {
        return id; // Return the deleted ID
      } else {
        return rejectWithValue(response.message || "Failed to delete order");
      }
    } catch (error: any) {
      console.error("Redux: Delete order error:", error);
      return rejectWithValue(error.message || "Failed to delete order");
    }
  }
);

// Get Orders by Company and Party
export const getOrdersByCompanyAndPartyThunk = createAsyncThunk(
  "order/getByCompanyAndParty",
  async (
    { companyId, partyId }: { companyId: string; partyId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.getOrdersByCompanyAndParty(
        companyId,
        partyId
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          "Invalid response format: orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get orders by company and party error:", error);
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

export const getDesignerOrdersThunk = createAsyncThunk(
  "order/getDesignerOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getDesignerOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);


export const getPrinterOrdersThunk = createAsyncThunk(
  "order/getPrinterOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getPrinterOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);


export const getBinderOrdersThunk = createAsyncThunk(
  "order/getBinderOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getBinderOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);


export const getBookletBinderThunk = createAsyncThunk(
  "order/getBookletBinderThunk",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getBookletBinder();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer orders"
      );
    }
  }
);

export const getOrdersByStaffIdThunk = createAsyncThunk(
  "order/getByStaffId",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrdersByStaffId(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Invalid response format: orders array not found"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch orders by staff ID"
      );
    }
  }
);



const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrderError(state) {
      state.error = null;
    },
    clearOrderSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleOrder(state) {
      state.singleOrder = null;
    },
    setOrders(state, action: PayloadAction<Order[]>) {
      state.orders = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      //GET DESIGNER ORDER
      .addCase(getDesignerOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getDesignerOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getDesignerOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })


      //GET BINDER ORDER
      .addCase(getBinderOrdersThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getBinderOrdersThunk.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(getBinderOrdersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.orders = [] // Clear orders on error
      })

      //get Booklet Binder
      .addCase(getBookletBinderThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getBookletBinderThunk.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(getBookletBinderThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.orders = [] // Clear orders on error
      })

      //get designer
      .addCase(getPrinterOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPrinterOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getPrinterOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Create Order
      .addCase(createOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createOrderThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.orders = [action.payload, ...state.orders];
          state.successMessage = "Order created successfully";
          state.error = null;
        }
      )
      .addCase(createOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get All Orders
      .addCase(getAllOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllOrdersThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: Order[];
            pagination: {
              currentPage: number;
              totalPages: number;
              hasNext: boolean;
              hasPrev: boolean;
            };
          }>
        ) => {
          state.loading = false;
          state.orders = action.payload.data;
          state.pagination = action.payload.pagination;
          state.totalCount = action.payload.data.length;
          state.error = null;
        }
      )
      .addCase(getAllOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Order By ID
      .addCase(getOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getOrderByIdThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.singleOrder = action.payload;
          state.error = null;
        }
      )
      .addCase(getOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleOrder = null;
      })

      // Update Order
      .addCase(updateOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateOrderThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          state.singleOrder = action.payload;
          state.successMessage = "Order updated successfully";
          state.error = null;
        }
      )
      .addCase(updateOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Order
      .addCase(deleteOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteOrderThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.orders = state.orders.filter(
            (order) => order._id !== action.payload
          );
          state.successMessage = "Order deleted successfully";
          state.error = null;
        }
      )
      .addCase(deleteOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Orders by Company and Party
      .addCase(getOrdersByCompanyAndPartyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getOrdersByCompanyAndPartyThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getOrdersByCompanyAndPartyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })
      .addCase(getOrdersByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orders = [];
      })
      .addCase(
        getOrdersByStaffIdThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getOrdersByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

  },
});

export const {
  clearOrderError,
  clearOrderSuccessMessage,
  clearSingleOrder,
  setOrders,
} = orderSlice.actions;

export default orderSlice.reducer;
