import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { orderService } from "@/services/qpOrder.service";


interface PaperField {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
}

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
  filePaths: string[];
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  printerPapers?: PaperField[];
  binderPapers?: PaperField[];
  bookletPapers?: PaperField[];
}

interface CreateOrderData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  filePaths?: string[];
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
export const createQpOrderThunk = createAsyncThunk(
  "qpOrder/create",
  async (data: CreateOrderData, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(data);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create QP order");
      }
    } catch (error: any) {
      console.error("Redux: Create QP order error:", error);
      return rejectWithValue(error.message || "Failed to create QP order");
    }
  }
);

// Get All Orders
export const getAllQPOrdersThunk = createAsyncThunk(
  "qpOrder/getAll",
  async (
    filters,
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.getAllOrders(filters);

      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      } else {
        return rejectWithValue(
          "Invalid response format: QP orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get all QP orders error:", error);
      return rejectWithValue(error.message || "Failed to fetch QP orders");
    }
  }
);

// Get Order By ID
export const getQPOrderByIdThunk = createAsyncThunk(
  "qpOrder/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "QP order not found");
      }
    } catch (error: any) {
      console.error("Redux: Get QP order by ID error:", error);
      return rejectWithValue(error.message || "Failed to fetch QP order");
    }
  }
);

// Update Order
export const updateQPOrderThunk = createAsyncThunk(
  "qpOrder/update",
  async (
    { id, data }: { id: string; data: any }, // ✅ destructure from one object
    { rejectWithValue }
  ) => {
    try {
      // console.log(id, data,'id, data')
      const response = await orderService.updateOrder(id, data);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update QP order");
      }
    } catch (error: any) {
      console.error("Redux: Update QP order error:", error);
      return rejectWithValue(error.message || "Failed to update QP order");
    }
  }
);


// Delete Order
export const deleteQPOrderThunk = createAsyncThunk(
  "qpOrder/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.deleteOrder(id);

      if (response.success) {
        return id; // Return the deleted ID
      } else {
        return rejectWithValue(response.message || "Failed to delete QP order");
      }
    } catch (error: any) {
      console.error("Redux: Delete QP order error:", error);
      return rejectWithValue(error.message || "Failed to delete QP order");
    }
  }
);

// Get Orders by Company and Party
export const getQPOrdersByCompanyAndPartyThunk = createAsyncThunk(
  "qpOrder/getByCompanyAndParty",
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
          "Invalid response format: QP orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get QP orders by company and party error:", error);
      return rejectWithValue(error.message || "Failed to fetch QP orders");
    }
  }
);

// Get Designer Orders
export const getDesignerQPOrdersThunk = createAsyncThunk(
  "qpOrder/getDesignerOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getDesignerOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer QP orders"
      );
    }
  }
);

// Get Printer Orders
export const getPrinterQPOrdersThunk = createAsyncThunk(
  "qpOrder/getPrinterOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getPrinterOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get printer QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch printer QP orders"
      );
    }
  }
);

// Get Binder Orders
export const getBinderQPOrdersThunk = createAsyncThunk(
  "qpOrder/getBinderOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getBinderOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get binder QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch binder QP orders"
      );
    }
  }
);

// Get Booklet Binder Orders
export const getBookletBinderQPOrdersThunk = createAsyncThunk(
  "qpOrder/getBookletBinderOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getBookletBinder();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get booklet binder QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch booklet binder QP orders"
      );
    }
  }
);

// Get Orders by Staff ID
export const getQPOrdersByStaffIdThunk = createAsyncThunk(
  "qpOrder/getByStaffId",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrdersByStaffId(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Invalid response format: QP orders array not found"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch QP orders by staff ID"
      );
    }
  }
);

export const updateQPOrderStatusThunk = createAsyncThunk(
  "qpOrder/updateStatus",
  async (
    { orderId, status, deliveryStatus, billPhotos }: {
      orderId: string;
      status?: any;
      deliveryStatus?: any;
      billPhotos?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
      if (billPhotos) updateData.billPhotos = billPhotos;

      const response = await orderService.driverStatusUpdate(orderId, updateData);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update order status");
      }
    } catch (error: any) {
      console.error("Redux: Update QP order status error:", error);
      return rejectWithValue(error.message || "Failed to update order status");
    }
  }
);

// Bulk Update Order Status - Driver
export const bulkUpdateQPOrderStatusThunk = createAsyncThunk(
  "qpOrder/bulkUpdateStatus",
  async (
    { orderIds, status, deliveryStatus, billPhotos, dispatchPhotos, dispatchTime, deliveryTime }: any,
    { rejectWithValue }
  ) => {
    try {
      console.log('Bulk update data:', { orderIds, status, deliveryStatus, billPhotos, dispatchPhotos, dispatchTime, deliveryTime });
      const updateData: any = { orderIds };
      if (status) updateData.status = status;
      if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
      if (billPhotos) updateData.billPhotos = billPhotos;
      if (dispatchPhotos) updateData.dispatchPhotos = dispatchPhotos;
      if (dispatchTime) updateData.dispatchTime = dispatchTime;
      if (deliveryTime) updateData.deliveryTime = deliveryTime;

      const response = await orderService.driverBulkStatusUpdate(updateData);

      if (response.success) {
        return {
          data: response.data || [],
          orderIds: orderIds
        };
      } else {
        return rejectWithValue(response.message || "Failed to bulk update order status");
      }
    } catch (error: any) {
      console.error("Redux: Bulk update QP order status error:", error);
      return rejectWithValue(error.message || "Failed to bulk update order status");
    }
  }
);

const qpOrderSlice = createSlice({
  name: "qpOrder",
  initialState,
  reducers: {
    clearQPOrderError(state) {
      state.error = null;
    },
    clearQPOrderSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleQPOrder(state) {
      state.singleOrder = null;
    },
    setQPOrders(state, action: PayloadAction<Order[]>) {
      state.orders = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createQpOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createQpOrderThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.orders = [action.payload, ...state.orders];
          state.successMessage = "QP Order created successfully";
          state.error = null;
        }
      )
      .addCase(createQpOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get All Orders
      .addCase(getAllQPOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllQPOrdersThunk.fulfilled,
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
      .addCase(getAllQPOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Order By ID
      .addCase(getQPOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getQPOrderByIdThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          state.singleOrder = action.payload;
          state.error = null;
        }
      )
      .addCase(getQPOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleOrder = null;
      })

      // Update Order
      .addCase(updateQPOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateQPOrderThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          state.singleOrder = action.payload;
          state.successMessage = "QP Order updated successfully";
          state.error = null;
        }
      )
      .addCase(updateQPOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Order
      .addCase(deleteQPOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteQPOrderThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.orders = state.orders.filter(
            (order) => order._id !== action.payload
          );
          state.successMessage = "QP Order deleted successfully";
          state.error = null;
        }
      )
      .addCase(deleteQPOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Orders by Company and Party
      .addCase(getQPOrdersByCompanyAndPartyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getQPOrdersByCompanyAndPartyThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getQPOrdersByCompanyAndPartyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Designer Orders
      .addCase(getDesignerQPOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getDesignerQPOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getDesignerQPOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Printer Orders
      .addCase(getPrinterQPOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPrinterQPOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getPrinterQPOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Binder Orders
      .addCase(getBinderQPOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getBinderQPOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getBinderQPOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Booklet Binder Orders
      .addCase(getBookletBinderQPOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getBookletBinderQPOrdersThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getBookletBinderQPOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Orders by Staff ID
      .addCase(getQPOrdersByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orders = [];
      })
      .addCase(
        getQPOrdersByStaffIdThunk.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getQPOrdersByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })
      .addCase(updateQPOrderStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateQPOrderStatusThunk.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.loading = false;
          // Update the order in the orders array
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          // Also update singleOrder if it's the current one
          if (state.singleOrder && state.singleOrder._id === action.payload._id) {
            state.singleOrder = action.payload;
          }
          state.successMessage = "Order status updated successfully";
          state.error = null;
        }
      )
      .addCase(updateQPOrderStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Bulk Update Order Status
      .addCase(bulkUpdateQPOrderStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkUpdateQPOrderStatusThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: Order[];
            orderIds: string[];
          }>
        ) => {
          state.loading = false;

          // Update all orders that were modified
          action.payload.data.forEach(updatedOrder => {
            const index = state.orders.findIndex(
              order => order._id === updatedOrder._id
            );
            if (index !== -1) {
              state.orders[index] = updatedOrder;
            }
          });

          state.successMessage = `Successfully updated ${action.payload.data.length} orders`;
          state.error = null;
        }
      )
      .addCase(bulkUpdateQPOrderStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearQPOrderError,
  clearQPOrderSuccessMessage,
  clearSingleQPOrder,
  setQPOrders,
} = qpOrderSlice.actions;

export default qpOrderSlice.reducer;