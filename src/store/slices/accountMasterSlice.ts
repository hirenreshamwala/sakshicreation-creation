import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  accountMasterService,
  AccountMaster,
  CreateAccountMaster,
  UpdateAccountMaster,
  PartySuggestion
} from "@/services/accountMaster.service";
import { toast } from "react-toastify";

// Thunks
export const getAllAccountMastersThunk = createAsyncThunk(
  "accountMasters/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.getAccountMasters();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch account masters");
    }
  }
);

export const getAccountMasterByCompanyAndPartyThunk = createAsyncThunk(
  "accountMaster/getByCompanyAndParty",
  async ({ companyId, partyId }: { companyId: string; partyId: string }, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.getAccountMasterByCompanyAndParty(companyId, partyId);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || "Failed to fetch account master");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch account master");
    }
  }
);

export const getAccountMasterByIdThunk = createAsyncThunk(
  "accountMasters/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.getAccountMasterById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch account master");
    }
  }
);

export const getAccountMasterByStaffIdThunk = createAsyncThunk(
  "accountMasters/getByStaffId",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.getAccountMasterByStaffId(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch account master");
    }
  }
);

export const createAccountMasterThunk = createAsyncThunk(
  "accountMasters/create",
  async (data: CreateAccountMaster, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.createAccountMaster(data);
      toast.success(response.message);
      return response.data;
    } catch (error: any) {
      toast.error(error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to create account master");
    }
  }
);

export const bulkCreateAccountMastersThunk = createAsyncThunk(
  "accountMasters/bulkCreate",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.bulkCreateAccountMasters(formData);
      toast.success(response.message);
      return response.data;
    } catch (error: any) {
      toast.error(error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to bulk create account masters");
    }
  }
);

export const updateAccountMasterThunk = createAsyncThunk(
  "accountMasters/update",
  async (
    { id, data }: { id: string; data: Partial<UpdateAccountMaster> },
    { rejectWithValue }
  ) => {
    try {
      const response = await accountMasterService.updateAccountMaster(id, data);
      toast.success(response.message);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update account master");
    }
  }
);

export const deleteAccountMasterThunk = createAsyncThunk(
  "accountMasters/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await accountMasterService.deleteAccountMaster(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete account master");
    }
  }
);

export const approvePartyThunk = createAsyncThunk(
  "accountMasters/approveParty",
  async (partyId: string, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.approveParty(partyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to approve party");
    }
  }
);

export const searchPartiesThunk = createAsyncThunk(
  "accountMasters/searchParties",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await accountMasterService.searchParties(query);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to search parties");
    }
  }
);

interface AccountMasterByCompanyParty {
  accountMaster: {
    _id: string;
    reasonToVisit: string;
    reference: string;
    createdAt: string;
    updatedAt: string;
    company: any;
    party: {
      _id: string;
      contactPerson: string;
      personWhatsAppNo: string;
      GSTNo: string;
      statusApproval: "Pending" | "Approved";
    };
    createdBy: any;
  };
}

interface AccountMasterState {
  accountMasters: AccountMaster[];
  singleAccountMaster: AccountMaster | AccountMasterByCompanyParty | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
  partySuggestions: PartySuggestion[];
}

const initialState: AccountMasterState = {
  accountMasters: [],
  singleAccountMaster: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  partySuggestions: [],
};

const accountMasterSlice = createSlice({
  name: "accountMasters",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleAccountMaster(state) {
      state.singleAccountMaster = null;
    },
    clearSuggestions(state) {
      state.partySuggestions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Account Master by Company and Party
      .addCase(getAccountMasterByCompanyAndPartyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAccountMasterByCompanyAndPartyThunk.fulfilled,
        (state, action: PayloadAction<AccountMasterByCompanyParty>) => {
          state.loading = false;
          state.singleAccountMaster = action.payload;
          state.error = null;
        }
      )
      .addCase(
        getAccountMasterByCompanyAndPartyThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
          state.singleAccountMaster = null;
        }
      )
      // Get All Account Masters
      .addCase(getAllAccountMastersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllAccountMastersThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster[]>) => {
          state.loading = false;
          state.accountMasters = action.payload;
          state.totalCount = action.payload.length;
        }
      )
      .addCase(getAllAccountMastersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.accountMasters = [];
      })
      // Get Single Account Master
      .addCase(getAccountMasterByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAccountMasterByIdThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster>) => {
          state.loading = false;
          state.singleAccountMaster = action.payload;
          state.successMessage = "Account master fetched successfully";
        }
      )
      .addCase(getAccountMasterByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAccountMasterByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAccountMasterByStaffIdThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster[]>) => {
          state.loading = false;
          state.accountMasters = action.payload;
          state.totalCount = action.payload.length;
          state.error = null;
        }
      )
      .addCase(getAccountMasterByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.accountMasters = [];
      })
      // Create Account Master
      .addCase(createAccountMasterThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createAccountMasterThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster>) => {
          state.loading = false;
          state.accountMasters = [...state.accountMasters, action.payload];
          state.successMessage = "Account master created successfully";
        }
      )
      .addCase(createAccountMasterThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Bulk Create Account Masters
      .addCase(bulkCreateAccountMastersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkCreateAccountMastersThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster[]>) => {
          state.loading = false;
          state.accountMasters = [...state.accountMasters, ...action.payload];
          state.successMessage = "Account masters created successfully";
        }
      )
      .addCase(bulkCreateAccountMastersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Account Master
      .addCase(updateAccountMasterThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateAccountMasterThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster>) => {
          state.loading = false;
          state.accountMasters = state.accountMasters.map((account) =>
            account._id === action.payload._id ? action.payload : account
          );
          state.successMessage = "Account master updated successfully";
        }
      )
      .addCase(updateAccountMasterThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Account Master
      .addCase(deleteAccountMasterThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteAccountMasterThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.accountMasters = state.accountMasters.filter(
            (account) => account._id !== action.payload
          );
          state.successMessage = "Account master deleted successfully";
        }
      )
      .addCase(deleteAccountMasterThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Approve Party
      .addCase(approvePartyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        approvePartyThunk.fulfilled,
        (state, action: PayloadAction<AccountMaster>) => {
          state.loading = false;
          state.accountMasters = state.accountMasters.map((account) =>
            account._id === action.payload._id ? action.payload : account
          );
          state.successMessage = "Party approved successfully";
        }
      )
      .addCase(approvePartyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(searchPartiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        searchPartiesThunk.fulfilled,
        (state, action: PayloadAction<PartySuggestion[]>) => {
          state.loading = false;
          state.partySuggestions = action.payload;
        }
      )
      .addCase(searchPartiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.partySuggestions = [];
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleAccountMaster, clearSuggestions } = accountMasterSlice.actions;
export default accountMasterSlice.reducer;