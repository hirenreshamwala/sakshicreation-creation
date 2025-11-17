  import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
  import { paymentFolderService } from '@/services/paymentFolder.service';

  export interface PaymentFolder {
    _id: string;
    company: string; // or Company type if you have a Company interface
    party: string; // or Party type
    assignedTo: string; // or Staff type
    assignedDate: string;
    remarks?: string;
    paymentType: string;
    month: string;
    paymentAmount: number;
    area?: string;
    receivedAmount: number;
    pendingAmount: number;
    createdAt?: string;
    updatedAt?: string;
  }

  export interface PaymentFolderState {
    paymentFolders: PaymentFolder[];
    currentPaymentFolder: PaymentFolder | null;
  }

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

  const initialState: PaymentFolderState = {
    paymentFolders: [],
    currentPaymentFolder: null,
  };

  // Simplified Slice
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
    },
    extraReducers: (builder) => {
      builder
        // Create Payment Folder
        .addCase(createPaymentFolderThunk.fulfilled, (state, action: PayloadAction<PaymentFolder>) => {
          state.paymentFolders.unshift(action.payload);
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
        .addCase(updatePaymentFolderThunk.fulfilled, (state, action: PayloadAction<PaymentFolder>) => {
          state.paymentFolders = state.paymentFolders.map((folder) =>
            folder._id === action.payload._id ? action.payload : folder
          );
          if (state.currentPaymentFolder && state.currentPaymentFolder._id === action.payload._id) {
            state.currentPaymentFolder = action.payload;
          }
        })
        // Delete Payment Folder
        .addCase(deletePaymentFolderThunk.fulfilled, (state, action: PayloadAction<string>) => {
          state.paymentFolders = state.paymentFolders.filter((folder) => folder._id !== action.payload);
          if (state.currentPaymentFolder && state.currentPaymentFolder._id === action.payload) {
            state.currentPaymentFolder = null;
          }
        });
    },
  });

  export const {
    clearCurrentPaymentFolder,
    setCurrentPaymentFolder,
  } = paymentFolderSlice.actions;

  export default paymentFolderSlice.reducer;