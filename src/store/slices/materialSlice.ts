import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  materialService,
  Material,
  CreateMaterial,
  UpdateMaterial,
} from '@/services/material.service';

export const getAllMaterialsThunk = createAsyncThunk(
  'materials/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await materialService.getMaterials();
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: data array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch materials');
    }
  }
);

export const getMaterialByIdThunk = createAsyncThunk(
  'materials/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await materialService.getMaterialById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch material');
    }
  }
);

export const createMaterialThunk = createAsyncThunk(
  'materials/create',
  async (data: CreateMaterial, { rejectWithValue }) => {
    try {
      const response = await materialService.createMaterial(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create material');
    }
  }
);

export const updateMaterialThunk = createAsyncThunk(
  'materials/update',
  async (
    { id, data }: { id: string; data: Partial<UpdateMaterial> },
    { rejectWithValue }
  ) => {
    try {
      const response = await materialService.updateMaterial(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update material');
    }
  }
);

export const deleteMaterialThunk = createAsyncThunk(
  'materials/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await materialService.deleteMaterial(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete material');
    }
  }
);

export const bulkCreateMaterialsThunk = createAsyncThunk(
  'materials/bulkCreate',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await materialService.bulkCreateMaterials(formData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk create materials');
    }
  }
);

interface MaterialState {
  materials: Material[];
  singleMaterial: Material | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: MaterialState = {
  materials: [],
  singleMaterial: null,
  loading: false,
  error: null,
  successMessage: null,
};

const materialSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleMaterial(state) {
      state.singleMaterial = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Materials
      .addCase(getAllMaterialsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllMaterialsThunk.fulfilled,
        (state, action: PayloadAction<Material[]>) => {
          state.loading = false;
          state.materials = action.payload;
          // state.successMessage = 'Materials fetched successfully';
        }
      )
      .addCase(getAllMaterialsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.materials = [];
      })
      // Get Single Material
      .addCase(getMaterialByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getMaterialByIdThunk.fulfilled,
        (state, action: PayloadAction<Material>) => {
          state.loading = false;
          state.singleMaterial = action.payload;
          state.successMessage = 'Material fetched successfully';
        }
      )
      .addCase(getMaterialByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Material
      .addCase(createMaterialThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createMaterialThunk.fulfilled,
        (state, action: PayloadAction<Material>) => {
          state.loading = false;
          state.materials = [...state.materials, action.payload];
          state.successMessage = 'Material created successfully';
        }
      )
      .addCase(createMaterialThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Material
      .addCase(updateMaterialThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateMaterialThunk.fulfilled,
        (state, action: PayloadAction<Material>) => {
          state.loading = false;
          state.materials = state.materials.map((material) =>
            material._id === action.payload._id ? action.payload : material
          );
          state.successMessage = 'Material updated successfully';
          state.error = null;
        }
      )
      .addCase(updateMaterialThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Material
      .addCase(deleteMaterialThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteMaterialThunk.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.materials = state.materials.filter(
            (material) => material._id !== action.payload
          );
          state.successMessage = 'Material deleted successfully';
        }
      )
      .addCase(deleteMaterialThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkCreateMaterialsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkCreateMaterialsThunk.fulfilled,
        (state, action: PayloadAction<Material[]>) => {
          state.loading = false;
          state.materials = [...state.materials, ...action.payload];
          state.successMessage = 'Bulk materials created successfully';
        }
      )
      .addCase(bulkCreateMaterialsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, clearSingleMaterial } =
  materialSlice.actions;
export default materialSlice.reducer;