import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { roleService, Role, CreateRole, UpdateRole } from "@/services/role.service";
import Request from "@/services/axios";
import Endpoint from "@/API/apiConfig";

// ──────────────────────────────────────────────────────
// Types for Pagination & Filters
// ──────────────────────────────────────────────────────
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface RoleFilters {
  page: number;
  limit: number;
  search: string;
  roleNames?: string[];
    totalStaff: string[];

}

interface AvailableFilters {
  roleNames: string[];
  totalStaff: string[];
}

interface RoleState {
  roles: Role[];
  singleRole: Role | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;

  // Server-side state
  pagination: Pagination | null;
  filters: RoleFilters;
  availableFilters: AvailableFilters;
}

// ──────────────────────────────────────────────────────
// Initial State
// ──────────────────────────────────────────────────────
const initialState: RoleState = {
  roles: [],
  singleRole: null,
  loading: false,
  error: null,
  successMessage: null,

  pagination: null,
  filters: {
    page: 1,
    limit: 10,
    search: "",
  },
  availableFilters: {
    roleNames: [],
    totalStaff: [],},
};

// ──────────────────────────────────────────────────────
// Thunks
// ──────────────────────────────────────────────────────

// GET ALL ROLES – with pagination + search + filter
export const getAllRolesThunk = createAsyncThunk(
  "roles/getAll",
  async (filters: Partial<RoleFilters> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.roleNames?.length) {
        filters.roleNames.forEach((name) => params.append("roleNames", name));
      }

      const response = await Request.get(`${Endpoint.GET_ALL_ROLES}?${params.toString()}`);
      return response.data; // { data: Role[], pagination: Pagination }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch roles");
    }
  }
);

// GET FILTER OPTIONS (for dropdown)
export const getRoleFiltersThunk = createAsyncThunk(
  "roles/getFilters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await Request.get(Endpoint.GET_ROLE_FILTERS);
      return response.data; // { roleNames: string[] }
    } catch (error: any) {
      return rejectWithValue("Failed to load filters");
    }
  }
);

// Other thunks (unchanged except small fixes)
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
  async ({ id, data }: { id: string; data: Partial<UpdateRole> }, { rejectWithValue }) => {
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

// ──────────────────────────────────────────────────────
// Slice
// ──────────────────────────────────────────────────────
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
    // Set filters (page, search, etc.)
    setRoleFilters(state, action: PayloadAction<Partial<RoleFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Get All Roles (with pagination) ──
      .addCase(getAllRolesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllRolesThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.roles = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAllRolesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── Get Filter Options ──
      .addCase(getRoleFiltersThunk.fulfilled, (state, action: PayloadAction<AvailableFilters>) => {
        state.availableFilters.roleNames = action.payload.roleNames || [];
        state.availableFilters.totalStaff = action.payload.totalStaff || [];
      })

      // ── Get Single Role ──
      .addCase(getRoleByIdThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getRoleByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.singleRole = action.payload;
      })
      .addCase(getRoleByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── Create Role ──
      .addCase(createRoleThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRoleThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = "Role created successfully";
      })
      .addCase(createRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── Update Role ──
      .addCase(updateRoleThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRoleThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        state.roles = state.roles.map((r) => (r._id === updated._id ? updated : r));
        if (state.singleRole?._id === updated._id) state.singleRole = updated;
        state.successMessage = "Role updated successfully";
      })
      .addCase(updateRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ── Delete Role ──
      .addCase(deleteRoleThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteRoleThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = state.roles.filter((r) => r._id !== action.payload);
        state.successMessage = "Role deleted successfully";
      })
      .addCase(deleteRoleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  clearSingleRole,
  setRoleFilters,
} = roleSlice.actions;

export default roleSlice.reducer;