import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { companyService } from "@/services/compnay.service"

interface Company {
  _id: string
  companyName: string
  name?: string
  partyList?: any[]
}

interface CompanyState {
  companies: Company[]
  loading: boolean
  error: string | null
  successMessage: string | null
}

const initialState: CompanyState = {
  companies: [],
  loading: false,
  error: null,
  successMessage: null,
}

export const getAllCompaniesThunk = createAsyncThunk(
  "company/getAll",
  async (hasParties = false, { rejectWithValue }) => {
    try {
      const response = await companyService.getAllCompanies(hasParties)
      console.log("Company API Response:", response)

      if (response.success && Array.isArray(response.data)) {
        return response.data
      } else {
        return rejectWithValue("Invalid response format: companies array not found")
      }
    } catch (error: any) {
      console.error("Company thunk error:", error)
      return rejectWithValue(error.message || "Failed to fetch companies")
    }
  },
)

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompanyError(state) {     
      state.error = null
    },
    clearCompanySuccessMessage(state) {
      state.successMessage = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCompaniesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllCompaniesThunk.fulfilled, (state, action: PayloadAction<Company[]>) => {
        state.loading = false
        state.companies = action.payload
        state.error = null
      })
      .addCase(getAllCompaniesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.companies = []
      })
  },
})

export const { clearCompanyError, clearCompanySuccessMessage } = companySlice.actions
export default companySlice.reducer
