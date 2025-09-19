import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { partyService } from "@/services/party.service"

interface Party {
  _id: string
  partyName: string
  companyId?: string;
  unitNo?: string;
  marketName?: string;
  // Add other party fields as needed
}

interface PartyState {
  parties: Party[]
  loading: boolean
  error: string | null
  qpParties: Party[];
  successMessage: string | null
}

const initialState: PartyState = {
  parties: [],
  qpParties: [],
  loading: false,
  error: null,
  successMessage: null,
}

export const getPartiesByCompanyThunk = createAsyncThunk(
  "party/getByCompany",
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await partyService.getPartiesByCompany(companyId)

      if (response.success && Array.isArray(response.data)) {
        return response.data
      } else {
        return rejectWithValue("Invalid response format: parties array not found")
      }
    } catch (error: any) {
      console.error("Party thunk error:", error)
      return rejectWithValue(error.message || "Failed to fetch parties")
    }
  },
)

export const getQualityPackingPartiesThunk = createAsyncThunk(
  "party/getQualityPackingParties",
  async (_, { rejectWithValue }) => {
    try {
      const response = await partyService.getQualityPackingParties();

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue("Invalid response format: Quality Packaging parties array not found");
      }
    } catch (error: any) {
      console.error("Quality Packaging parties thunk error:", error);
      return rejectWithValue(error.message || "Failed to fetch Quality Packaging parties");
    }
  }
);

const partySlice = createSlice({
  name: "party",
  initialState,
  reducers: {
    clearPartyError(state) {
      state.error = null
    },
    clearPartySuccessMessage(state) {
      state.successMessage = null
    },
    clearParties(state) {
      state.parties = []
      state.qpParties = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPartiesByCompanyThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPartiesByCompanyThunk.fulfilled, (state, action: PayloadAction<Party[]>) => {
        state.loading = false
        state.parties = action.payload
        state.error = null
      })
      .addCase(getPartiesByCompanyThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.parties = []
      })
      .addCase(getQualityPackingPartiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQualityPackingPartiesThunk.fulfilled, (state, action: PayloadAction<Party[]>) => {
        state.loading = false;
        state.qpParties = action.payload; // Store in qpParties
        state.error = null;
      })
      .addCase(getQualityPackingPartiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.qpParties = [];
      });
  },
})

export const { clearPartyError, clearPartySuccessMessage, clearParties } = partySlice.actions
export default partySlice.reducer
