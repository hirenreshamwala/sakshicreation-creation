import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { complainService, Complaint } from "@/services/complain.service";

interface ComplainState {
    complains: Complaint[];
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


const initialState: ComplainState = {
    complains: [],
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


// =================== THUNKS ===================
export const getAllComplainsThunk = createAsyncThunk(
    "complain/getAll",
    async (filters: any, { rejectWithValue }) => {
        try {
            const response = await complainService.getAllComplains(filters);
            if (response.success && Array.isArray(response.data)) {
                return {
                    data: response.data,
                    totalCount: response.totalCount || 0,
                    pagination: response.pagination || {
                        currentPage: filters?.page || 1,
                        totalPages: Math.ceil((response.totalCount || 0) / (filters?.pageSize || 10)),
                        hasNext: false,
                        hasPrev: false,
                    },
                };
            } else {
                return rejectWithValue("Invalid response format: complains array not found");
            }
        } catch (error: any) {
            return rejectWithValue(error.message || "Failed to fetch complains");
        }
    }
);


export const createComplainThunk = createAsyncThunk(
  "complain/create",
  async (payload: Complaint, { rejectWithValue }) => {
    try {
      const response = await complainService.createComplain(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create complain");
    }
  }
);

export const updateComplainThunk = createAsyncThunk(
  "complain/update",
  async ({ id, payload }: { id: string; payload: Partial<Complaint> }, { rejectWithValue }) => {
    try {
      const response = await complainService.updateComplain(id, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update complain");
    }
  }
);

export const deleteComplainThunk = createAsyncThunk(
  "complain/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await complainService.deleteComplain(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete complain");
    }
  }
);

export const getComplainsByStaffThunk = createAsyncThunk<{
    data: Complaint[];
    totalCount: number;
    pagination: any;
}, { staffId: string; filters?: any }, { rejectValue: string }>(
    "complains/getByStaff",
    async ({ staffId, filters }, { rejectWithValue }) => {
        try {
            const res = await complainService.getComplainsByStaff(staffId, filters);
            return {
                data: res.data || [],
                totalCount: res.totalCount || 0,
                pagination: res.pagination || {
                    currentPage: filters?.page || 1,
                    totalPages: Math.ceil((res.totalCount || 0) / (filters?.pageSize || 10)),
                    hasNext: false,
                    hasPrev: false,
                },
            };
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);


// =================== SLICE ===================
const complainSlice = createSlice({
  name: "complain",
  initialState,
  reducers: {
    clearComplainError(state) {
      state.error = null;
    },
    clearComplainSuccessMessage(state) {
      state.successMessage = null;
    },
    clearComplains(state) {
      state.complains = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // GET ALL
                  .addCase(getAllComplainsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllComplainsThunk.fulfilled, (state, action: PayloadAction<{
                data: Complaint[];
                totalCount: number;
                pagination: any;
            }>) => {
                state.loading = false;
                state.complains = action.payload.data;
                state.totalCount = action.payload.totalCount;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllComplainsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })


      // CREATE
      .addCase(createComplainThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createComplainThunk.fulfilled, (state, action: PayloadAction<Complaint>) => {
        state.loading = false;
        state.complains.unshift(action.payload);
        state.successMessage = "Complain created successfully";
      })
      .addCase(createComplainThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // UPDATE
      .addCase(updateComplainThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateComplainThunk.fulfilled, (state, action: PayloadAction<Complaint>) => {
        state.loading = false;
        const index = state.complains.findIndex(c => c._id === action.payload._id);
        if (index !== -1) state.complains[index] = action.payload;
        state.successMessage = "Complain updated successfully";
      })
      .addCase(updateComplainThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // DELETE
      .addCase(deleteComplainThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteComplainThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.complains = state.complains.filter(c => c._id !== action.payload);
        state.successMessage = "Complain deleted successfully";
      })
      .addCase(deleteComplainThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(getComplainsByStaffThunk.pending, (state) => {
          state.loading = true;
          state.error = null;
      })
      .addCase(getComplainsByStaffThunk.fulfilled, (state, action) => {
          state.loading = false;
          state.complains = action.payload.data;
          state.totalCount = action.payload.totalCount;
          state.pagination = action.payload.pagination;
      })
      .addCase(getComplainsByStaffThunk.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || "Failed to fetch complains by staff";
      })
  },
});

export const { clearComplainError, clearComplainSuccessMessage, clearComplains } = complainSlice.actions;
export default complainSlice.reducer;
