import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { leadService } from '@/services/lead.service';
import { Lead } from '@/services/types';

export const getAllLeadsThunk = createAsyncThunk(
  'leads/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leadService.getAllLeads();
      if (!response || typeof response !== 'object') {
        return rejectWithValue('Invalid response from server');
      }
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else if (response.success && !response.data) {
        return [];
      } else {
        return rejectWithValue(response.message || 'Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leads');
    }
  }
);

export const bulkCreateLeadsThunk = createAsyncThunk(
  'leads/bulkCreate',
  async (leadsData: Partial<Lead>[], { rejectWithValue }) => {
    try {
      const response = await leadService.bulkCreateLeads(leadsData);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Invalid response format');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create leads');
    }
  }
);

export const getLeadsByStaffIdThunk = createAsyncThunk(
  'leads/getByStaffId',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await leadService.getLeadsByStaffId(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: leads array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leads by staff ID');
    }
  }
);

export const createLeadThunk = createAsyncThunk(
  'leads/create',
  async (data: Partial<Lead>, { rejectWithValue }) => {
    try {
      const response = await leadService.createLead(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create lead');
    }
  }
);

export const updateLeadThunk = createAsyncThunk(
  'leads/update',
  async ({ id, data }: { id: string; data: Partial<Lead> }, { rejectWithValue }) => {
    try {
      const response = await leadService.updateLead(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update lead');
    }
  }
);

export const deleteLeadThunk = createAsyncThunk(
  'leads/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await leadService.deleteLead(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete lead');
    }
  }
);

interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
  successMessage: null,
};

const leadSlice = createSlice({
  name: 'leads',
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
      // Get All Leads
      .addCase(getAllLeadsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllLeadsThunk.fulfilled, (state, action: PayloadAction<Lead[]>) => {
        state.loading = false;
        state.leads = action.payload;
      })
      .addCase(getAllLeadsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.leads = [];
      })
      // Get Leads by Staff ID
      .addCase(getLeadsByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.leads = [];
      })
      .addCase(getLeadsByStaffIdThunk.fulfilled, (state, action: PayloadAction<Lead[]>) => {
        state.loading = false;
        state.leads = action.payload;
      })
      .addCase(getLeadsByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.leads = [];
      })
      // Create Lead
      .addCase(createLeadThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeadThunk.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.loading = false;
        state.leads = [...state.leads, action.payload];
        state.successMessage = 'Lead created successfully';
      })
      .addCase(createLeadThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Lead
      .addCase(updateLeadThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeadThunk.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.loading = false;
        state.leads = state.leads.map((lead) =>
          lead._id === action.payload._id ? action.payload : lead
        );
        state.successMessage = 'Lead updated successfully';
      })
      .addCase(updateLeadThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Lead
      .addCase(deleteLeadThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLeadThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.leads = state.leads.filter((lead) => lead._id !== action.payload);
        state.successMessage = 'Lead deleted successfully';
      })
      .addCase(deleteLeadThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Bulk Create Leads
      .addCase(bulkCreateLeadsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateLeadsThunk.fulfilled, (state, action: PayloadAction<Lead[]>) => {
        state.loading = false;
        state.leads = [...state.leads, ...action.payload];
        state.successMessage = 'Leads created successfully';
      })
      .addCase(bulkCreateLeadsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage } = leadSlice.actions;
export default leadSlice.reducer;