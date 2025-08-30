
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { statusService } from "@/services/status.service"

interface Status {
  _id: string
  name: string
  orderNumber: number
  isDefault: boolean
  isActive: boolean
  color: string
  description: string
  statusType: string
  createdBy: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface CreateStatusData {
  name: string
  orderNumber: number
  isDefault?: boolean
  isActive?: boolean
  color?: string
  description?: string
  createdBy?: string
}

interface StatusState {
  // Separate arrays for different status types
  orderStatuses: Status[]
  taskStatuses: Status[]
  singleStatus: Status | null
  loading: boolean
  error: string | null
  successMessage: string | null
  pagination: {
    currentPage: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const initialState: StatusState = {
  orderStatuses: [],
  taskStatuses: [],
  singleStatus: null,
  loading: false,
  error: null,
  successMessage: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
}

// Create Status
export const createStatusThunk = createAsyncThunk(
  "status/create",
  async ({ type, data }: { type: string; data: CreateStatusData }, { rejectWithValue }) => {
    try {
      console.log(`Redux: Creating ${type} status with data:`, data)
      const response = await statusService.createStatus(type, data)
      console.log(`Redux: Create ${type} status response:`, response)

      if (response.success) {
        return { type, data: response.data }
      } else {
        return rejectWithValue(response.message || `Failed to create ${type} status`)
      }
    } catch (error: any) {
      console.error(`Redux: Create ${type} status error:`, error)
      return rejectWithValue(error.message || `Failed to create ${type} status`)
    }
  },
)

// Get All Statuses
export const getAllStatusesThunk = createAsyncThunk(
  "status/getAll",
  async (
    {
      type,
      params,
    }: {
      type: string
      params?: {
        page?: number
        limit?: number
        isActive?: boolean
        search?: string
      }
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await statusService.getAllStatuses(type, params)
      console.log(`Redux: Get all ${type} statuses response:`, response)

      if (response.success && Array.isArray(response.data)) {
        return {
          type,
          data: response.data,
          pagination: response.pagination,
        }
      } else {
        return rejectWithValue(`Invalid response format: ${type} statuses array not found`)
      }
    } catch (error: any) {
      console.error(`Redux: Get all ${type} statuses error:`, error)
      return rejectWithValue(error.message || `Failed to fetch ${type} statuses`)
    }
  },
)

// Get Status By ID
export const getStatusByIdThunk = createAsyncThunk(
  "status/getById",
  async ({ type, id }: { type: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await statusService.getStatusById(type, id)
      console.log(`Redux: Get ${type} status by ID response:`, response)

      if (response.success && response.data) {
        return response.data
      } else {
        return rejectWithValue(response.message || `${type} status not found`)
      }
    } catch (error: any) {
      console.error(`Redux: Get ${type} status by ID error:`, error)
      return rejectWithValue(error.message || `Failed to fetch ${type} status`)
    }
  },
)

// Update Status
export const updateStatusThunk = createAsyncThunk(
  "status/update",
  async ({ type, id, data }: { type: string; id: string; data: Partial<CreateStatusData> }, { rejectWithValue }) => {
    try {
      const response = await statusService.updateStatus(type, id, data)
      console.log(`Redux: Update ${type} status response:`, response)

      if (response.success) {
        return { type, data: response.data }
      } else {
        return rejectWithValue(response.message || `Failed to update ${type} status`)
      }
    } catch (error: any) {
      console.error(`Redux: Update ${type} status error:`, error)
      return rejectWithValue(error.message || `Failed to update ${type} status`)
    }
  },
)

// Delete Status
export const deleteStatusThunk = createAsyncThunk(
  "status/delete",
  async ({ type, id }: { type: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await statusService.deleteStatus(type, id)
      console.log(`Redux: Delete ${type} status response:`, response)

      if (response.success) {
        return { type, id }
      } else {
        return rejectWithValue(response.message || `Failed to delete ${type} status`)
      }
    } catch (error: any) {
      console.error(`Redux: Delete ${type} status error:`, error)
      return rejectWithValue(error.message || `Failed to delete ${type} status`)
    }
  },
)

// Get Default Status
export const getDefaultStatusThunk = createAsyncThunk(
  "status/getDefault",
  async (type: string, { rejectWithValue }) => {
    try {
      const response = await statusService.getDefaultStatus(type)
      console.log(`Redux: Get default ${type} status response:`, response)

      if (response.success && response.data) {
        return response.data
      } else {
        return rejectWithValue(response.message || `No default ${type} status found`)
      }
    } catch (error: any) {
      console.error(`Redux: Get default ${type} status error:`, error)
      return rejectWithValue(error.message || `Failed to fetch default ${type} status`)
    }
  },
)

const statusSlice = createSlice({
  name: "status",
  initialState,
  reducers: {
    clearStatusError(state) {
      state.error = null
    },
    clearStatusSuccessMessage(state) {
      state.successMessage = null
    },
    clearSingleStatus(state) {
      state.singleStatus = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Status
      .addCase(createStatusThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createStatusThunk.fulfilled, (state, action: PayloadAction<{ type: string; data: Status }>) => {
        state.loading = false
        const { type, data } = action.payload

        if (type === "order") {
          state.orderStatuses = [data, ...state.orderStatuses].sort((a, b) => a.orderNumber - b.orderNumber)
        } else if (type === "task") {
          state.taskStatuses = [data, ...state.taskStatuses].sort((a, b) => a.orderNumber - b.orderNumber)
        }

        state.successMessage = `${type} status created successfully`
        state.error = null
      })
      .addCase(createStatusThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Get All Statuses
      .addCase(getAllStatusesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(
        getAllStatusesThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            type: string
            data: Status[]
            pagination: any
          }>,
        ) => {
          state.loading = false
          const { type, data, pagination } = action.payload

          if (type === "order") {
            state.orderStatuses = data
          } else if (type === "task") {
            state.taskStatuses = data
          }

          state.pagination = pagination || state.pagination
          state.error = null
        },
      )
      .addCase(getAllStatusesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Get Status By ID
      .addCase(getStatusByIdThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getStatusByIdThunk.fulfilled, (state, action: PayloadAction<Status>) => {
        state.loading = false
        state.singleStatus = action.payload
        state.error = null
      })
      .addCase(getStatusByIdThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.singleStatus = null
      })

      // Update Status
      .addCase(updateStatusThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateStatusThunk.fulfilled, (state, action: PayloadAction<{ type: string; data: Status }>) => {
        state.loading = false
        const { type, data } = action.payload

        if (type === "order") {
          const index = state.orderStatuses.findIndex((status) => status._id === data._id)
          if (index !== -1) {
            state.orderStatuses[index] = data
            state.orderStatuses.sort((a, b) => a.orderNumber - b.orderNumber)
          }
        } else if (type === "task") {
          const index = state.taskStatuses.findIndex((status) => status._id === data._id)
          if (index !== -1) {
            state.taskStatuses[index] = data
            state.taskStatuses.sort((a, b) => a.orderNumber - b.orderNumber)
          }
        }

        state.singleStatus = data
        state.successMessage = `${type} status updated successfully`
        state.error = null
      })
      .addCase(updateStatusThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Delete Status
      .addCase(deleteStatusThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteStatusThunk.fulfilled, (state, action: PayloadAction<{ type: string; id: string }>) => {
        state.loading = false
        const { type, id } = action.payload

        if (type === "order") {
          state.orderStatuses = state.orderStatuses.filter((status) => status._id !== id)
        } else if (type === "task") {
          state.taskStatuses = state.taskStatuses.filter((status) => status._id !== id)
        }

        state.successMessage = `${type} status deleted successfully`
        state.error = null
      })
      .addCase(deleteStatusThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Get Default Status
      .addCase(getDefaultStatusThunk.fulfilled, (state, action: PayloadAction<Status>) => {
        state.singleStatus = action.payload
      })
  },
})

export const { clearStatusError, clearStatusSuccessMessage, clearSingleStatus } = statusSlice.actions

export default statusSlice.reducer
