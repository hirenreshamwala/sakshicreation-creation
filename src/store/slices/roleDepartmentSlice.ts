import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  roleDepartmentService,
  RoleDepartment,
  CreateRoleDepartment,
  UpdateRoleDepartment,
  RoleDepartmentCompany,
  CreateRoleDepartmentCompany,
  UpdateRoleDepartmentCompany,
  CompanyName,
  Party,
  ApiResponse,
} from '@/services/roleDepartment.service';

// State Interface
interface RoleDepartmentState {
  roleDepartments: RoleDepartment[];
  roleDepartmentCompanies: RoleDepartmentCompany[];
  companies: CompanyName[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

// Initial State
const initialState: RoleDepartmentState = {
  roleDepartments: [],
  roleDepartmentCompanies: [],
  companies: [],
  loading: false,
  error: null,
  successMessage: null,
};

// Thunks for CompanyName
export const getAllCompaniesThunk = createAsyncThunk(
  'companies/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.getAllCompanies();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch companies');
    }
  }
);

// Thunks for RoleDepartment
export const getAllRoleDepartmentsThunk = createAsyncThunk(
  'roleDepartments/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.getAllRoleDepartments();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch role departments');
    }
  }
);

export const getRoleDepartmentByIdThunk = createAsyncThunk(
  'roleDepartments/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.getRoleDepartmentById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch role department');
    }
  }
);

export const createRoleDepartmentThunk = createAsyncThunk(
  'roleDepartments/create',
  async (data: CreateRoleDepartment, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.createRoleDepartment(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create role department');
    }
  }
);

export const updateRoleDepartmentThunk = createAsyncThunk(
  'roleDepartments/update',
  async (
    { id, data }: { id: string; data: Partial<UpdateRoleDepartment> },
    { rejectWithValue }
  ) => {
    try {
      const response = await roleDepartmentService.updateRoleDepartment(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update role department');
    }
  }
);

export const deleteRoleDepartmentThunk = createAsyncThunk(
  'roleDepartments/delete',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { roleDepartments: RoleDepartmentState };
      const hasDependencies = state.roleDepartments.roleDepartmentCompanies.some(
        (company) =>
          (typeof company.roleDepartment === 'string'
            ? company.roleDepartment
            : company.roleDepartment._id) === id
      );
      if (hasDependencies) {
        return rejectWithValue('Cannot delete role department: it is referenced by role department companies');
      }
      await roleDepartmentService.deleteRoleDepartment(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete role department');
    }
  }
);

// Thunks for RoleDepartmentCompany
export const getAllRoleDepartmentCompaniesThunk = createAsyncThunk(
  'roleDepartmentCompanies/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.getAllRoleDepartmentCompanies();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch role department companies');
    }
  }
);

export const getRoleDepartmentCompanyByIdThunk = createAsyncThunk(
  'roleDepartmentCompanies/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.getRoleDepartmentCompanyById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch role department company');
    }
  }
);

export const createRoleDepartmentCompanyThunk = createAsyncThunk(
  'roleDepartmentCompanies/create',
  async (data: CreateRoleDepartmentCompany, { rejectWithValue }) => {
    try {
      const response = await roleDepartmentService.createRoleDepartmentCompany(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create role department company');
    }
  }
);

export const updateRoleDepartmentCompanyThunk = createAsyncThunk(
  'roleDepartmentCompanies/update',
  async (
    { id, data }: { id: string; data: Partial<UpdateRoleDepartmentCompany> },
    { rejectWithValue }
  ) => {
    try {
      const response = await roleDepartmentService.updateRoleDepartmentCompany(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update role department company');
    }
  }
);

export const deleteRoleDepartmentCompanyThunk = createAsyncThunk(
  'roleDepartmentCompanies/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await roleDepartmentService.deleteRoleDepartmentCompany(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete role department company');
    }
  }
);

// Slice
const roleDepartmentSlice = createSlice({
  name: 'roleDepartments',
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
    // Get All Companies
    builder
      .addCase(getAllCompaniesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCompaniesThunk.fulfilled, (state, action: PayloadAction<CompanyName[]>) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(getAllCompaniesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.companies = [];
      })
      // Get All RoleDepartments
      .addCase(getAllRoleDepartmentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllRoleDepartmentsThunk.fulfilled, (state, action: PayloadAction<RoleDepartment[]>) => {
        state.loading = false;
        state.roleDepartments = action.payload;
      })
      .addCase(getAllRoleDepartmentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.roleDepartments = [];
      })
      // Get Single RoleDepartment
      .addCase(getRoleDepartmentByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRoleDepartmentByIdThunk.fulfilled, (state, action: PayloadAction<RoleDepartment>) => {
        state.loading = false;
        state.successMessage = 'Role department fetched successfully';
      })
      .addCase(getRoleDepartmentByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create RoleDepartment
      .addCase(createRoleDepartmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoleDepartmentThunk.fulfilled, (state, action: PayloadAction<RoleDepartment>) => {
        state.loading = false;
        state.roleDepartments = [...state.roleDepartments, action.payload];
        state.successMessage = 'Role department created successfully';
      })
      .addCase(createRoleDepartmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update RoleDepartment
      .addCase(updateRoleDepartmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoleDepartmentThunk.fulfilled, (state, action: PayloadAction<RoleDepartment>) => {
        state.loading = false;
        state.roleDepartments = state.roleDepartments.map((dept) =>
          dept._id === action.payload._id ? action.payload : dept
        );
        state.successMessage = 'Role department updated successfully';
      })
      .addCase(updateRoleDepartmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete RoleDepartment
      .addCase(deleteRoleDepartmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoleDepartmentThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.roleDepartments = state.roleDepartments.filter((dept) => dept._id !== action.payload);
        state.roleDepartmentCompanies = state.roleDepartmentCompanies.filter(
          (company) => (typeof company.roleDepartment === 'string' ? company.roleDepartment : company.roleDepartment._id) !== action.payload
        );
        state.successMessage = 'Role department deleted successfully';
      })
      .addCase(deleteRoleDepartmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get All RoleDepartmentCompanies
      .addCase(getAllRoleDepartmentCompaniesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllRoleDepartmentCompaniesThunk.fulfilled, (state, action: PayloadAction<RoleDepartmentCompany[]>) => {
        state.loading = false;
        state.roleDepartmentCompanies = action.payload;
      })
      .addCase(getAllRoleDepartmentCompaniesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.roleDepartmentCompanies = [];
      })
      // Get Single RoleDepartmentCompany
      .addCase(getRoleDepartmentCompanyByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRoleDepartmentCompanyByIdThunk.fulfilled, (state, action: PayloadAction<RoleDepartmentCompany>) => {
        state.loading = false;
        state.successMessage = 'Role department company fetched successfully';
      })
      .addCase(getRoleDepartmentCompanyByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create RoleDepartmentCompany
      .addCase(createRoleDepartmentCompanyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoleDepartmentCompanyThunk.fulfilled, (state, action: PayloadAction<RoleDepartmentCompany>) => {
        state.loading = false;
        state.roleDepartmentCompanies = [...state.roleDepartmentCompanies, action.payload];
        state.successMessage = 'Role department company created successfully';
      })
      .addCase(createRoleDepartmentCompanyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update RoleDepartmentCompany
      .addCase(updateRoleDepartmentCompanyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoleDepartmentCompanyThunk.fulfilled, (state, action: PayloadAction<RoleDepartmentCompany>) => {
        state.loading = false;
        state.roleDepartmentCompanies = state.roleDepartmentCompanies.map((company) =>
          company._id === action.payload._id ? action.payload : company
        );
        state.successMessage = 'Role department company updated successfully';
      })
      .addCase(updateRoleDepartmentCompanyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete RoleDepartmentCompany
      .addCase(deleteRoleDepartmentCompanyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoleDepartmentCompanyThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.roleDepartmentCompanies = state.roleDepartmentCompanies.filter(
          (company) => company._id !== action.payload
        );
        state.successMessage = 'Role department company deleted successfully';
      })
      .addCase(deleteRoleDepartmentCompanyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage } = roleDepartmentSlice.actions;
export default roleDepartmentSlice.reducer;