import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { roleService, Role, CreateRole, UpdateRole } from "@/services/role.service";

export const getAllRolesThunk = createAsyncThunk(
  "roles/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleService.getAllRoles();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue("Invalid response format: data array not found");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch roles");
    }
  }
);

export const getRoleByIdThunk = createAsyncThunk(
  "roles/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roleService.getRoleById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch role");
    }
  }
);

export const createRoleThunk = createAsyncThunk(
  "roles/create",
  async (data: CreateRole, { rejectWithValue }) => {
    try {
      const response = await roleService.createRole(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create role");
    }
  }
);

export const updateRoleThunk = createAsyncThunk(
  "roles/update",
  async (
    { id, data }: { id: string; data: Partial<UpdateRole> },
    { rejectWithValue }
  ) => {
    try {
      const response = await roleService.updateRole(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update role");
    }
  }
);

export const deleteRoleThunk = createAsyncThunk(
  "roles/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await roleService.deleteRole(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete role");
    }
  }
);

interface RoleState {
  roles: Role[];
  singleRole: Role | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: RoleState = {
  roles: [],
  singleRole: null,
  loading: false,
  error: null,
  successMessage: null,
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleRole(state) {
      state.singleRole = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Roles
      .addCase(getAllRolesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllRolesThunk.fulfilled,
        (state, action: PayloadAction<Role[]>) => {
          state.loading = false;
          state.roles = action.payload;
        }
      )
      .addCase(getAllRolesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.roles = [];
      })
      // Get Single Role
      .addCase(getRoleByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getRoleByIdThunk.fulfilled,
        (state, action: PayloadAction<Role>) => {
          state.loading = false;
          state.singleRole = action.payload;
          state.successMessage = "Role fetched successfully";
        }
      )
      .addCase(getRoleByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Role
      .addCase(createRoleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createRoleThunk.fulfilled,
        (state, action: PayloadAction<Role>) => {
          state.loading = false;
          state.roles = [...state.roles, action.payload];
          state.successMessage = "Role created successfully";
        }
      )
      .addCase(createRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Role
      .addCase(updateRoleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateRoleThunk.fulfilled,
        (state, action: PayloadAction<Role>) => {
          state.loading = false;
          state.roles = state.roles.map((role) =>
            role._id === action.payload._id ? action.payload : role
          );
          state.successMessage = "Role updated successfully";
          state.error = null;
        }
      )
      .addCase(updateRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Role
      .addCase(deleteRoleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteRoleThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.roles = state.roles.filter((role) => role._id !== action.payload);
          state.successMessage = "Role deleted successfully";
        }
      )
      .addCase(deleteRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleRole } = roleSlice.actions;
export default roleSlice.reducer;