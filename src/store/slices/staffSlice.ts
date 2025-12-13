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

interface StaffState {
  staffList: Staff[];
  roleDetails: RoleDetails | null;
  loading: boolean;
  error: string | null;
  currentStaff: any | null; // For detailed staff view
}

const initialState: StaffState = {
  staffList: [],
  roleDetails: null,
  currentStaff: null,
  loading: false,
  error: null,
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

// Get all staff
export const getAllStaffThunk = createAsyncThunk("staff/getAll", async (_, { rejectWithValue }) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }
    const response = await Request.get(Endpoint.GET_ALL_STAFF);

    if (response.data.success && Array.isArray(response.data.data)) {
      const staffList = response.data.data.map((staff: any) => ({
        id: staff._id || staff.id,
        name: staff.name || `${staff.firstName} ${staff.lastName}`,
        ...staff, // Spread all properties, including new file fields
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
        aadharFiles: staff.aadharFiles || [], // Ensure it's an array
        addressFiles: staff.addressFiles || [], // Ensure it's an array
      }))
      return {
        staffList,
        fullStaffData: response.data.data,
      }
    } else {
      return rejectWithValue("Invalid staff response format")
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch staff list")
  }
})

export const getRoleThunk = createAsyncThunk("staff/getRole", async (roleName: string, { rejectWithValue }) => {
  try {
    const response = await Request.post(
      Endpoint.GET_ROLE,
      { roleName })

    if (response.data.success) {
      return response.data
    } else {
      return rejectWithValue(response.data.message || "Failed to fetch role details")
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch role details")
  }
})

// Get staff by ID
export const getStaffByIdThunk = createAsyncThunk("staff/getById", async (id: string, { rejectWithValue }) => {
  try {
    const data = await staffApiCall(`${Endpoint.GET_STAFF_BY_ID}/${id}`, "get")
    console.log(data,'data')
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
      aadharFiles: data.aadharFiles || [], // Include new field
      addressFiles: data.addressFiles || [], // Include new field
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch staff details")
  }
})

// Create staff
export const createStaffThunk = createAsyncThunk(
  "staff/create",
  async (staffData: Omit<Staff, "id">, { rejectWithValue }) => {
    try {
      const data = await staffApiCall(Endpoint.CREATE_STAFF, "post", staffData)
      return {
        id: data._id,
        ...staffData,
        aadharFiles: staffData.aadharFiles || [], // Ensure it's an array
        addressFiles: staffData.addressFiles || [], // Ensure it's an array
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create staff")
    }
  },
);

// Update staff
export const updateStaffThunk = createAsyncThunk(
  "staff/update",
  async ({ id, ...staffData }: Partial<Staff> & { id: string }, { rejectWithValue }) => {
    try {
      const data = await staffApiCall(`${Endpoint.UPDATE_STAFF}/${id}`, "patch", staffData)
      return {
        id,
        ...data,
        aadharFiles: data.aadharFiles || [], // Ensure it's an array
        addressFiles: data.addressFiles || [], // Ensure it's an array
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update staff")
    }
  }
);

// Update staff status
export const updateStaffStatusThunk = createAsyncThunk(
  "staff/updateStatus",
  async ({ id, status }: { id: string; status: boolean }, { rejectWithValue }) => {
    try {
      const data = await staffApiCall(`${Endpoint.UPDATE_STAFF_STATUS}/${id}`, "patch", { status })
      return {
        id,
        status: data.status,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update staff status")
    }
  }
);

// Delete staff
export const deleteStaffThunk = createAsyncThunk("staff/delete", async (id: string, { rejectWithValue }) => {
  try {
    await staffApiCall(`${Endpoint.DELETE_STAFF}/${id}`, "delete")
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete staff")
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
      // Extract the error message from the response
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
    }
  },
  extraReducers: (builder) => {
    builder
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
            fullStaffData: any[]
          }>,
        ) => {
          state.loading = false;
          state.staffList = action.payload.staffList
        },
      )
      .addCase(getAllStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.staffList = [];
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
        state.error = action.payload as string
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
        const index = state.staffList.findIndex((staff) => staff.id === action.payload.id)
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
        const index = state.staffList.findIndex((staff) => staff.id === action.payload.id)
        if (index !== -1) {
          state.staffList[index].status = action.payload.status
        }
        if (state.currentStaff?.id === action.payload.id) {
          state.currentStaff.status = action.payload.status
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
        state.staffList = state.staffList.filter((staff) => staff.id !== action.payload)
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

})

export const { clearError, clearCurrentStaff } = staffSlice.actions
export default staffSlice.reducer
