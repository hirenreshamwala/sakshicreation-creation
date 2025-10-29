import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { saleQpOrderService } from "@/services/saleQpOrder.service";

interface PaperField {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
}

interface SaleQpOrder {
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
  deliveryStatus?: "not_started" | "loading" | "in_transit" | "delivered" | "cancelled";
  driver?: any;
  loadingStartDate?: string | null;
  loadingEndDate?: string | null;
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

interface CreateSaleQpOrderData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  filePaths?: string[];
  createdBy?: string;
}

interface SaleQpOrderState {
  orders: SaleQpOrder[];
  singleOrder: SaleQpOrder | null;
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

const initialState: SaleQpOrderState = {
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

// Create Sale QP Order
export const createSaleQpOrderThunk = createAsyncThunk(
  "saleQpOrder/create",
  async (data: CreateSaleQpOrderData, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.createSaleQpOrder(data);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to create sale QP order");
      }
    } catch (error: any) {
      console.error("Redux: Create sale QP order error:", error);
      return rejectWithValue(error.message || "Failed to create sale QP order");
    }
  }
);

// Get All Sale QP Orders
export const getAllSaleQpOrdersThunk = createAsyncThunk(
  "saleQpOrder/getAll",
  async (
    filters,
    { rejectWithValue }
  ) => {
    try {
      const response = await saleQpOrderService.getAllSaleQpOrders(filters);

      if (response.success && Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: response.pagination,
        };
      } else {
        return rejectWithValue(
          "Invalid response format: Sale QP orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get all sale QP orders error:", error);
      return rejectWithValue(error.message || "Failed to fetch sale QP orders");
    }
  }
);

// Get Sale QP Order By ID
export const getSaleQpOrderByIdThunk = createAsyncThunk(
  "saleQpOrder/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.getSaleQpOrderById(id);

      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Sale QP order not found");
      }
    } catch (error: any) {
      console.error("Redux: Get sale QP order by ID error:", error);
      return rejectWithValue(error.message || "Failed to fetch sale QP order");
    }
  }
);

// Update Sale QP Order
export const updateSaleQpOrderThunk = createAsyncThunk(
  "saleQpOrder/update",
  async (
    { id, data }: { id: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await saleQpOrderService.updateSaleQpOrder(id, data);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update sale QP order");
      }
    } catch (error: any) {
      console.error("Redux: Update sale QP order error:", error);
      return rejectWithValue(error.message || "Failed to update sale QP order");
    }
  }
);

// Delete Sale QP Order
export const deleteSaleQpOrderThunk = createAsyncThunk(
  "saleQpOrder/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.deleteSaleQpOrder(id);

      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.message || "Failed to delete sale QP order");
      }
    } catch (error: any) {
      console.error("Redux: Delete sale QP order error:", error);
      return rejectWithValue(error.message || "Failed to delete sale QP order");
    }
  }
);

// Get Sale QP Orders by Company and Party
export const getSaleQpOrdersByCompanyAndPartyThunk = createAsyncThunk(
  "saleQpOrder/getByCompanyAndParty",
  async (
    { companyId, partyId }: { companyId: string; partyId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await saleQpOrderService.getSaleQpOrdersByCompanyAndParty(
        companyId,
        partyId
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          "Invalid response format: Sale QP orders array not found"
        );
      }
    } catch (error: any) {
      console.error("Redux: Get sale QP orders by company and party error:", error);
      return rejectWithValue(error.message || "Failed to fetch sale QP orders");
    }
  }
);

// Get Designer Sale QP Orders
export const getDesignerSaleQpOrdersThunk = createAsyncThunk(
  "saleQpOrder/getDesignerOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.getDesignerSaleQpOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get designer sale QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch designer sale QP orders"
      );
    }
  }
);

// Get Printer Sale QP Orders
export const getPrinterSaleQpOrdersThunk = createAsyncThunk(
  "saleQpOrder/getPrinterOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.getPrinterSaleQpOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get printer sale QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch printer sale QP orders"
      );
    }
  }
);

// Get Binder Sale QP Orders
export const getBinderSaleQpOrdersThunk = createAsyncThunk(
  "saleQpOrder/getBinderOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.getBinderSaleQpOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get binder sale QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch binder sale QP orders"
      );
    }
  }
);

// Get Booklet Binder Sale QP Orders
export const getBookletBinderSaleQpOrdersThunk = createAsyncThunk(
  "saleQpOrder/getBookletBinderOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.getBookletBinderSaleQpOrders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Invalid response format");
      }
    } catch (error: any) {
      console.error("Redux: Get booklet binder sale QP orders error:", error);
      return rejectWithValue(
        error.message || "Failed to fetch booklet binder sale QP orders"
      );
    }
  }
);

// Get Sale QP Orders by Staff ID
export const getSaleQpOrdersByStaffIdThunk = createAsyncThunk(
  "saleQpOrder/getByStaffId",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.getSaleQpOrdersByStaffId(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || "Invalid response format: Sale QP orders array not found"
        );
      }
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch sale QP orders by staff ID"
      );
    }
  }
);

// Update Sale QP Order Status
export const updateSaleQpOrderStatusThunk = createAsyncThunk(
  "saleQpOrder/updateStatus",
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

      const response = await saleQpOrderService.driverStatusUpdate(orderId, updateData);

      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to update sale QP order status");
      }
    } catch (error: any) {
      console.error("Redux: Update sale QP order status error:", error);
      return rejectWithValue(error.message || "Failed to update sale QP order status");
    }
  }
);

// Bulk Update Sale QP Order Status - Driver
export const bulkUpdateSaleQpOrderStatusThunk = createAsyncThunk(
  "saleQpOrder/bulkUpdateStatus",
  async (
    { orderIds, status, deliveryStatus, billPhotos, dispatchPhotos, dispatchTime, deliveryTime, billNumber }: any,
    { rejectWithValue }
  ) => {
    try {
      console.log('Bulk update data for sale QP orders:', { orderIds, status, deliveryStatus, billPhotos, dispatchPhotos, dispatchTime, deliveryTime, billNumber });
      const updateData: any = { orderIds };
      if (status) updateData.status = status;
      if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
      if (billPhotos) updateData.billPhotos = billPhotos;
      if (dispatchPhotos) updateData.dispatchPhotos = dispatchPhotos;
      if (dispatchTime) updateData.dispatchTime = dispatchTime;
      if (deliveryTime) updateData.deliveryTime = deliveryTime;
      if (billNumber) updateData.billNumber = billNumber;

      const response = await saleQpOrderService.driverBulkStatusUpdate(updateData);

      if (response.success) {
        return {
          data: response.data || [],
          orderIds: orderIds
        };
      } else {
        return rejectWithValue(response.message || "Failed to bulk update sale QP order status");
      }
    } catch (error: any) {
      console.error("Redux: Bulk update sale QP order status error:", error);
      return rejectWithValue(error.message || "Failed to bulk update sale QP order status");
    }
  }
);

// Remove Loading Sale QP Order
export const removeLoadingSaleQpOrderThunk = createAsyncThunk(
  "saleQpOrder/removeLoading",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await saleQpOrderService.removeLoadingSaleQpOrder(orderId);

      if (response.success) {
        return {
          updatedOrder: response.data,
          orderId: orderId
        };
      } else {
        return rejectWithValue(response.message || "Failed to remove loading sale QP order");
      }
    } catch (error: any) {
      console.error("Redux: Remove loading sale QP order error:", error);
      return rejectWithValue(error.message || "Failed to remove loading sale QP order");
    }
  }
);

const saleQpOrderSlice = createSlice({
  name: "saleQpOrder",
  initialState,
  reducers: {
    clearSaleQpOrderError(state) {
      state.error = null;
    },
    clearSaleQpOrderSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleSaleQpOrder(state) {
      state.singleOrder = null;
    },
    setSaleQpOrders(state, action: PayloadAction<SaleQpOrder[]>) {
      state.orders = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Sale QP Order
      .addCase(createSaleQpOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createSaleQpOrderThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder>) => {
          state.loading = false;
          state.orders = [action.payload, ...state.orders];
          state.successMessage = "Sale QP Order created successfully";
          state.error = null;
        }
      )
      .addCase(createSaleQpOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get All Sale QP Orders
      .addCase(getAllSaleQpOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllSaleQpOrdersThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: SaleQpOrder[];
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
      .addCase(getAllSaleQpOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Sale QP Order By ID
      .addCase(getSaleQpOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getSaleQpOrderByIdThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder>) => {
          state.loading = false;
          state.singleOrder = action.payload;
          state.error = null;
        }
      )
      .addCase(getSaleQpOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.singleOrder = null;
      })

      // Update Sale QP Order
      .addCase(updateSaleQpOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSaleQpOrderThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder>) => {
          state.loading = false;
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          state.singleOrder = action.payload;
          state.successMessage = "Sale QP Order updated successfully";
          state.error = null;
        }
      )
      .addCase(updateSaleQpOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Sale QP Order
      .addCase(deleteSaleQpOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteSaleQpOrderThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.orders = state.orders.filter(
            (order) => order._id !== action.payload
          );
          state.successMessage = "Sale QP Order deleted successfully";
          state.error = null;
        }
      )
      .addCase(deleteSaleQpOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Sale QP Orders by Company and Party
      .addCase(getSaleQpOrdersByCompanyAndPartyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getSaleQpOrdersByCompanyAndPartyThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getSaleQpOrdersByCompanyAndPartyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Designer Sale QP Orders
      .addCase(getDesignerSaleQpOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getDesignerSaleQpOrdersThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getDesignerSaleQpOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Printer Sale QP Orders
      .addCase(getPrinterSaleQpOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPrinterSaleQpOrdersThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getPrinterSaleQpOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Binder Sale QP Orders
      .addCase(getBinderSaleQpOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getBinderSaleQpOrdersThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getBinderSaleQpOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Booklet Binder Sale QP Orders
      .addCase(getBookletBinderSaleQpOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getBookletBinderSaleQpOrdersThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getBookletBinderSaleQpOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Get Sale QP Orders by Staff ID
      .addCase(getSaleQpOrdersByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orders = [];
      })
      .addCase(
        getSaleQpOrdersByStaffIdThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder[]>) => {
          state.loading = false;
          state.orders = action.payload;
          state.error = null;
        }
      )
      .addCase(getSaleQpOrdersByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.orders = [];
      })

      // Update Sale QP Order Status
      .addCase(updateSaleQpOrderStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSaleQpOrderStatusThunk.fulfilled,
        (state, action: PayloadAction<SaleQpOrder>) => {
          state.loading = false;
          const index = state.orders.findIndex(
            (order) => order._id === action.payload._id
          );
          if (index !== -1) {
            state.orders[index] = action.payload;
          }
          if (state.singleOrder && state.singleOrder._id === action.payload._id) {
            state.singleOrder = action.payload;
          }
          state.successMessage = "Sale QP Order status updated successfully";
          state.error = null;
        }
      )
      .addCase(updateSaleQpOrderStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Bulk Update Sale QP Order Status
      .addCase(bulkUpdateSaleQpOrderStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkUpdateSaleQpOrderStatusThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: SaleQpOrder[];
            orderIds: string[];
          }>
        ) => {
          state.loading = false;

          action.payload.data.forEach(updatedOrder => {
            const index = state.orders.findIndex(
              order => order._id === updatedOrder._id
            );
            if (index !== -1) {
              state.orders[index] = updatedOrder;
            }
          });

          state.successMessage = `Successfully updated ${action.payload.data.length} sale QP orders`;
          state.error = null;
        }
      )
      .addCase(bulkUpdateSaleQpOrderStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Remove Loading Sale QP Order
      .addCase(removeLoadingSaleQpOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        removeLoadingSaleQpOrderThunk.fulfilled,
        (state, action: PayloadAction<{ updatedOrder: SaleQpOrder; orderId: string }>) => {
          state.loading = false;

          const { updatedOrder, orderId } = action.payload;

          const index = state.orders.findIndex(
            (order) => order._id === orderId
          );

          if (index !== -1) {
            state.orders[index] = updatedOrder;
          }

          if (state.singleOrder && state.singleOrder._id === orderId) {
            state.singleOrder = updatedOrder;
          }

          state.successMessage = "Sale QP Order removed from loading successfully";
          state.error = null;
        }
      )
      .addCase(removeLoadingSaleQpOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearSaleQpOrderError,
  clearSaleQpOrderSuccessMessage,
  clearSingleSaleQpOrder,
  setSaleQpOrders,
} = saleQpOrderSlice.actions;

export default saleQpOrderSlice.reducer;