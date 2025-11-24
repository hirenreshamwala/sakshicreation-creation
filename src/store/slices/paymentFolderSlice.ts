import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentFolderService } from '@/services/paymentFolder.service';

export interface Payment {
  _id?: string;
  date: string;
  amount: number;
  remark: string;
  paymentMethod: string;
  receivedBy: any;
}

export interface PaymentFolder {
  _id: string;
  company: any;
  party: any;
  assignedTo: any;
  assignedDate: string;
  remarks?: string;
  paymentType: string;
  month: string;
  paymentAmount: number;
  area?: string;
  paymentTerms?: string;
  receivedAmount: number;
  pendingAmount: number;
  payments: Payment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentFolderState {
  paymentFolders: PaymentFolder[];
  currentPaymentFolder: PaymentFolder | null;
  loading: boolean;
  error: string | null;
}

// Add this multiple delete thunk
export const deleteMultiplePaymentFoldersThunk = createAsyncThunk(
  'paymentFolders/deleteMultiple',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const response = await paymentFolderService.deleteMultiplePaymentFolders(ids);
      return { deletedIds: ids, response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete payment folders');
    }
  }
);

export const createPaymentFolderThunk = createAsyncThunk(
  'paymentFolders/create',
  async (data: Partial<PaymentFolder>, { rejectWithValue }) => {
    try {
      const response = await paymentFolderService.createPaymentFolder(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create payment folder');
    }
  }
);

export const getAllPaymentFoldersThunk = createAsyncThunk(
  'paymentFolders/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await paymentFolderService.getAllPaymentFolders();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment folders');
    }
  }
);

export const getPaymentFolderByIdThunk = createAsyncThunk(
  'paymentFolders/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await paymentFolderService.getPaymentFolderById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payment folder');
    }
  }
);

export const updatePaymentFolderThunk = createAsyncThunk(
  'paymentFolders/update',
  async ({ id, data }: { id: string; data: Partial<PaymentFolder> }, { rejectWithValue }) => {
    try {
      const response = await paymentFolderService.updatePaymentFolder(id, data);
      console.log(response,'response');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update payment folder');
    }
  }
);

export const deletePaymentFolderThunk = createAsyncThunk(
  'paymentFolders/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await paymentFolderService.deletePaymentFolder(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete payment folder');
    }
  }
);

export const addPaymentToFolderThunk = createAsyncThunk(
  'paymentFolders/addPayment',
  async ({ folderId, payment }: { folderId: string; payment: Partial<Payment> }, { rejectWithValue }) => {
    try {
      const response = await paymentFolderService.addPaymentFolder(folderId, payment);
      return response;
    } catch (error: any) {
      console.log(error, 'error in addPaymentToFolderThunk');
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add payment');
    }
  }
);

const initialState: PaymentFolderState = {
  paymentFolders: [],
  currentPaymentFolder: null,
  loading: false,
  error: null,
};

const paymentFolderSlice = createSlice({
  name: 'paymentFolders',
  initialState,
  reducers: {
    clearCurrentPaymentFolder(state) {
      state.currentPaymentFolder = null;
    },
    setCurrentPaymentFolder(state, action: PayloadAction<PaymentFolder | null>) {
      state.currentPaymentFolder = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    // New direct update reducer
    updatePaymentFolderInState(state, action: PayloadAction<PaymentFolder>) {
      const updatedFolder = action.payload;
      if (updatedFolder && updatedFolder._id) {
        // Update in paymentFolders array
        state.paymentFolders = state.paymentFolders.map((folder) =>
          folder._id === updatedFolder._id ? updatedFolder : folder
        );

        // Update currentPaymentFolder if it's the same
        if (state.currentPaymentFolder && state.currentPaymentFolder._id === updatedFolder._id) {
          state.currentPaymentFolder = updatedFolder;
        }
      }
    },
    // Add payment directly to folder in state
    addPaymentToFolderInState(state, action: PayloadAction<{ folderId: string; payment: Payment }>) {
      const { folderId, payment } = action.payload;

      const folderIndex = state.paymentFolders.findIndex(folder => folder._id === folderId);

      if (folderIndex !== -1) {
        // Add payment to payments array
        state.paymentFolders[folderIndex].payments.push(payment);

        // Recalculate receivedAmount and pendingAmount
        const totalReceived = state.paymentFolders[folderIndex].payments.reduce(
          (total, payment) => total + payment.amount, 0
        );

        state.paymentFolders[folderIndex].receivedAmount = totalReceived;
        state.paymentFolders[folderIndex].pendingAmount =
          state.paymentFolders[folderIndex].paymentAmount - totalReceived;

        // Update currentPaymentFolder if it's the same
        if (state.currentPaymentFolder && state.currentPaymentFolder._id === folderId) {
          state.currentPaymentFolder = state.paymentFolders[folderIndex];
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Folder
      .addCase(createPaymentFolderThunk.fulfilled, (state, action: PayloadAction<any>) => {
        if (action.payload.newData) {
          state.paymentFolders.unshift(action.payload.newData);
        }
      })
      // Get All Payment Folders
      .addCase(getAllPaymentFoldersThunk.fulfilled, (state, action: PayloadAction<PaymentFolder[]>) => {
        state.paymentFolders = action.payload;
      })
      // Get Payment Folder by ID
      .addCase(getPaymentFolderByIdThunk.fulfilled, (state, action: PayloadAction<PaymentFolder>) => {
        state.currentPaymentFolder = action.payload;
      })
      // Update Payment Folder
      // .addCase(updatePaymentFolderThunk.fulfilled, (state, action: PayloadAction<any>) => {
      //   const updatedFolder = action.payload.data;
      //   if (updatedFolder && updatedFolder._id) {
      //     state.paymentFolders = state.paymentFolders.map((folder) =>
      //       folder._id === updatedFolder._id ? updatedFolder : folder
      //     );
      //     if (state.currentPaymentFolder && state.currentPaymentFolder._id === updatedFolder._id) {
      //       state.currentPaymentFolder = updatedFolder;
      //     }
      //   }
      // })
      // Delete Payment Folder (Single)
      .addCase(deletePaymentFolderThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.paymentFolders = state.paymentFolders.filter((folder) => folder._id !== action.payload);
        if (state.currentPaymentFolder && state.currentPaymentFolder._id === action.payload) {
          state.currentPaymentFolder = null;
        }
      })
      // Delete Multiple Payment Folders
      .addCase(deleteMultiplePaymentFoldersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultiplePaymentFoldersThunk.fulfilled, (state, action: PayloadAction<{ deletedIds: string[]; response: any }>) => {
        state.loading = false;
        const { deletedIds } = action.payload;

        // Remove all deleted folders from state
        state.paymentFolders = state.paymentFolders.filter(
          (folder) => !deletedIds.includes(folder._id)
        );

        // Clear current payment folder if it was deleted
        if (state.currentPaymentFolder && deletedIds.includes(state.currentPaymentFolder._id)) {
          state.currentPaymentFolder = null;
        }
      })
      .addCase(deleteMultiplePaymentFoldersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // Add Payment to Folder
    // .addCase(addPaymentToFolderThunk.pending, (state) => {
    //   state.loading = true;
    //   state.error = null;
    // })
    // .addCase(addPaymentToFolderThunk.fulfilled, (state, action: PayloadAction<any>) => {
    //   state.loading = false;
    //   const updatedFolder = action.payload.data;
    //   // Add safety check for updatedFolder and _id
    //   if (updatedFolder && updatedFolder._id) {
    //     state.paymentFolders = state.paymentFolders.map((folder) =>
    //       folder._id === updatedFolder._id ? updatedFolder : folder
    //     );
    //     if (state.currentPaymentFolder && state.currentPaymentFolder._id === updatedFolder._id) {
    //       state.currentPaymentFolder = updatedFolder;
    //     }
    //   }
    // })
    // .addCase(addPaymentToFolderThunk.rejected, (state, action) => {
    //   state.loading = false;
    //   state.error = action.payload as string;
    // });
  },
});

export const {
  clearCurrentPaymentFolder,
  setCurrentPaymentFolder,
  clearError,
  updatePaymentFolderInState,
  addPaymentToFolderInState
} = paymentFolderSlice.actions;

export default paymentFolderSlice.reducer;