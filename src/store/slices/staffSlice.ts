// src/store/slices/staffSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from '@/services/auth.service';
import Request from '@/services/axios';

interface Staff {
  id: string;
  name: string;
  // Additional fields for enhanced functionality
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
  whatsappNo?: string;
  address?: string;
  aadharNo?: string;
  joiningDate?: string;
  birthDay?: string;
  role?: { _id: string; roleName: string } // Populated role object
  companyName?: { _id: string; companyName: string } | string // Populated companyName or ID
  status?: boolean;
  aadharFiles?: string[] // New field
  addressFiles?: string[] // New field
}

interface RoleDetails {
  id: string;
  roleName: string;
  permissions: any;
  totalUser: number;
  staffMembers: Staff[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface StaffFilters {
  page: number;
  limit: number;
  search: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  // Add multiple filter support
  filters: {
    role: string[];
    staff: string[];
    company: string[];
  };
}

interface StaffState {
  staffList: Staff[];
  roleDetails: RoleDetails | null;
  currentStaff: any | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  filters: StaffFilters;
  availableFilters: {
    roles: string[];
    companies: string[];
     staff: string[];
     joiningDates: string[];
  };
}

const initialState: StaffState = {
  staffList: [],
  roleDetails: null,
  currentStaff: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  },
   filters: {
    page: 1,
    limit: 10,
    search: "",
    role: "",
    company: "",
    startDate: "",
    endDate: "",
    filters: { // ADD MULTIPLE FILTERS
      role: [],
      staff: [],
      company: []
    }
  },
  availableFilters: {
    roles: [],
    companies: [],
     staff: [],
  },
};

// Helper function for API calls
const staffApiCall = async (url: string, method: string, data?: any) => {
  const token = authService.getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }
  const config = {
    method,
    url,
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
    data,
  };
  const response = await axios(config);
  if (!response.data.success) {
    throw new Error(response.data.message || "Request failed");
  }
  return response.data.data;
};

// In your staffSlice.ts - Update the getAllStaffThunk to properly handle arrays
export const getAllStaffThunk = createAsyncThunk(
  "staff/getAll", 
  async (filters: Partial<StaffFilters> & { roles?: string[]; staffNames?: string[] } = {}, { rejectWithValue }) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Build query parameters properly for arrays
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        
        // Handle arrays properly
        if (Array.isArray(value)) {
          // For arrays, append each value separately
          value.forEach(item => {
            if (item) params.append(key, item);
          });
        } else {
          // For single values
          params.append(key, value.toString());
        }
      });

      console.log('API Params:', params.toString()); // Debug log

      const response = await Request.get(`${Endpoint.GET_ALL_STAFF}?${params.toString()}`);

      if (response.data.success && Array.isArray(response.data.data)) {
        const staffList = response.data.data.map((staff: any) => ({
          id: staff._id || staff.id,
          name: staff.name || `${staff.firstName} ${staff.lastName}`,
          ...staff,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          mobileNo: staff.mobileNo,
          mobileCode: staff.mobileCode,
          whatsappNo: staff.whatsappNo,
          whatsappCode: staff.whatsappCode,
          address: staff.address,
          aadharNo: staff.aadharNo,
          joiningDate: staff.joiningDate,
          birthDay: staff.birthDay,
          role: staff.role,
          companyName: staff.companyName,
          status: staff.status,
          aadharFiles: staff.aadharFiles || [],
          addressFiles: staff.addressFiles || [],
        }));

        return {
          staffList,
          fullStaffData: response.data.data,
          pagination: response.data.pagination || {
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.data.data.length / (filters.limit || 10)),
            totalItems: response.data.data.length,
            itemsPerPage: filters.limit || 10,
          }
        };
      } else {
        return rejectWithValue("Invalid staff response format");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch staff list");
    }
  }
);

// Get available filters for staff
export const getStaffFiltersThunk = createAsyncThunk(
  "staff/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Request.get(Endpoint.GET_STAFF_FILTERS);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message || "Failed to fetch filters");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch filters");
    }
  }
);

export const getRoleThunk = createAsyncThunk("staff/getRole", async (roleName: string, { rejectWithValue }) => {
  try {
    const response = await Request.post(
      Endpoint.GET_ROLE,
      { roleName });

    if (response.data.success) {
      return response.data;
    } else {
      return rejectWithValue(response.data.message || "Failed to fetch role details");
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch role details");
  }
});

// Get staff by ID
export const getStaffByIdThunk = createAsyncThunk("staff/getById", async (id: string, { rejectWithValue }) => {
  try {
    const data = await staffApiCall(`${Endpoint.GET_STAFF_BY_ID}/${id}`, "get");
    console.log(data,'data');
    return {
      id: data._id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobileNo: data.mobileNo,
      whatsappNo: data.whatsappNo,
      address: data.address,
      aadharNo: data.aadharNo,
      joiningDate: data.joiningDate,
      birthDay: data.birthDay,
      role: data.role,
      companyName: data.CompanyName,
      password: data.password,
      status: data.status,
      aadharFiles: data.aadharFiles || [],
      addressFiles: data.addressFiles || [],
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch staff details");
  }
});

// Create staff
export const createStaffThunk = createAsyncThunk(
  "staff/create",
  async (staffData: Omit<Staff, "id">, { rejectWithValue }) => {
    try {
      const data = await staffApiCall(Endpoint.CREATE_STAFF, "post", staffData);
      return {
        id: data._id,
        ...staffData,
        aadharFiles: staffData.aadharFiles || [],
        addressFiles: staffData.addressFiles || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create staff");
    }
  },
);

// Update staff
export const updateStaffThunk = createAsyncThunk(
  "staff/update",
  async ({ id, ...staffData }: Partial<Staff> & { id: string }, { rejectWithValue }) => {
    try {
      const data = await staffApiCall(`${Endpoint.UPDATE_STAFF}/${id}`, "patch", staffData);
      return {
        id,
        ...data,
        aadharFiles: data.aadharFiles || [],
        addressFiles: data.addressFiles || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update staff");
    }
  }
);

// Update staff status
export const updateStaffStatusThunk = createAsyncThunk(
  "staff/updateStatus",
  async ({ id, status }: { id: string; status: boolean }, { rejectWithValue }) => {
    try {
      const data = await staffApiCall(`${Endpoint.UPDATE_STAFF_STATUS}/${id}`, "patch", { status });
      return {
        id,
        status: data.status,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update staff status");
    }
  }
);

// Delete staff
export const deleteStaffThunk = createAsyncThunk("staff/delete", async (id: string, { rejectWithValue }) => {
  try {
    await staffApiCall(`${Endpoint.DELETE_STAFF}/${id}`, "delete");
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete staff");
  }
});

export const bulkCreateStaffThunk = createAsyncThunk(
  'staff/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await Request.post(Endpoint.BULK_CREATE_STAFF, formData);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Bulk create failed');
      }
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk create staff');
    }
  }
);

export const updateStaffPasswordThunk = createAsyncThunk(
  "staff/updatePassword",
  async (
    { id, currentPassword, newPassword }: { id: string; currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await Request.patch(
        `${Endpoint.UPDATE_STAFF_PASSWORD}/${id}`,
        { currentPassword, newPassword });

      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to update password");
      }

      return { id, message: response.data.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update password";
      return rejectWithValue(errorMessage);
    }
  }
);

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearRoleDetails(state) {
      state.roleDetails = null;
    },
    clearCurrentStaff(state) {
      state.currentStaff = null;
    },
    // New reducers for filters and pagination
    setFilters(state, action: PayloadAction<Partial<StaffFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    setPagination(state, action: PayloadAction<Partial<Pagination>>) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all staff with filters
      .addCase(getAllStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllStaffThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            staffList: Staff[];
            fullStaffData: any[];
            pagination: Pagination;
          }>,
        ) => {
          state.loading = false;
          state.staffList = action.payload.staffList;
          state.pagination = action.payload.pagination;
        },
      )
      .addCase(getAllStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.staffList = [];
      })
      
      // Get staff filters
      .addCase(getStaffFiltersThunk.fulfilled, (state, action: PayloadAction<{ roles: string[]; companies: string[] }>) => {
        state.availableFilters = action.payload;
      })
      .addCase(getStaffFiltersThunk.rejected, (state, action) => {
        console.error("Failed to fetch staff filters:", action.payload);
      })
      
      .addCase(getRoleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRoleThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.roleDetails = {
          id: action.payload.role._id,
          roleName: action.payload.role.roleName,
          permissions: action.payload.role.permissions,
          totalUser: action.payload.totalStaff,
          staffMembers: action.payload.staffMembers.map((staff: any) => ({
            id: staff._id,
            name: `${staff.firstName} ${staff.lastName}`,
          })),
        };
      })
      .addCase(getRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.roleDetails = null;
      })
      .addCase(getStaffByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStaffByIdThunk.fulfilled, (state, action: PayloadAction<Staff>) => {
        state.loading = false;
        state.currentStaff = action.payload;
      })
      .addCase(getStaffByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create staff
      .addCase(createStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaffThunk.fulfilled, (state, action: PayloadAction<Staff>) => {
        state.loading = false;
        state.staffList.push(action.payload);
        // Update total items count
        state.pagination.totalItems += 1;
      })
      .addCase(createStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update staff
      .addCase(updateStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffThunk.fulfilled, (state, action: PayloadAction<Staff>) => {
        state.loading = false;
        const index = state.staffList.findIndex((staff) => staff.id === action.payload.id);
        if (index !== -1) {
          state.staffList[index] = action.payload;
        }
        if (state.currentStaff?.id === action.payload.id) {
          state.currentStaff = action.payload;
        }
      })
      .addCase(updateStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update staff status
      .addCase(updateStaffStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffStatusThunk.fulfilled, (state, action: PayloadAction<{ id: string; status: boolean }>) => {
        state.loading = false;
        const index = state.staffList.findIndex((staff) => staff.id === action.payload.id);
        if (index !== -1) {
          state.staffList[index].status = action.payload.status;
        }
        if (state.currentStaff?.id === action.payload.id) {
          state.currentStaff.status = action.payload.status;
        }
      })
      .addCase(updateStaffStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete staff
      .addCase(deleteStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaffThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.staffList = state.staffList.filter((staff) => staff.id !== action.payload);
        // Update total items count
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1);
        if (state.currentStaff?.id === action.payload) {
          state.currentStaff = null;
        }
      })
      .addCase(deleteStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkCreateStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkCreateStaffThunk.fulfilled, (state, action: PayloadAction<Staff[]>) => {
        state.loading = false;
        state.staffList = [...state.staffList, ...action.payload];
        // Update total items count
        state.pagination.totalItems += action.payload.length;
      })
      .addCase(bulkCreateStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStaffPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffPasswordThunk.fulfilled, (state, action: PayloadAction<{ id: string; message: string }>) => {
        state.loading = false;
      })
      .addCase(updateStaffPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearCurrentStaff, 
  clearRoleDetails,
  setFilters, 
  resetFilters, 
  setPagination 
} = staffSlice.actions;

export default staffSlice.reducer;