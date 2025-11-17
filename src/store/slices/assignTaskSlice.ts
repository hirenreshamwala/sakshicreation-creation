import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { assignTaskService, AssignTask, CreateAssignTask, UpdateAssignTask } from '@/services/assignTask.service';

export const getAllAssignTasksThunk = createAsyncThunk(
  'assignTasks/getAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await assignTaskService.getAllAssignTasks(filters);

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: tasks array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assigned tasks');
    }
  }
);

export const getAssignTaskByIdThunk = createAsyncThunk(
  'assignTasks/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await assignTaskService.getAssignTaskById(id);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: task not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assigned task');
    }
  }
);

export const getAssignTaskByStaffIdThunk = createAsyncThunk(
  'assignTasks/getByStaffId',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await assignTaskService.getAssignTaskByStaffId(id);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: tasks array not found');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assigned tasks');
    }
  }
);

export const createAssignTaskThunk = createAsyncThunk(
  'assignTasks/create',
  async (data: CreateAssignTask, { rejectWithValue }) => {
    try {
      const response = await assignTaskService.createAssignTask(data);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue('Invalid response format: task creation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create assigned task');
    }
  }
);

export const updateAssignTaskThunk = createAsyncThunk(
  'assignTasks/update',
  async ({ id, data }: { id: string; data: Partial<UpdateAssignTask> }, { rejectWithValue }) => {
    try {
      const response = await assignTaskService.updateAssignTask(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update assigned task');
    }
  }
);

export const deleteAssignTaskThunk = createAsyncThunk(
  'assignTasks/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await assignTaskService.deleteAssignTask(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue('Invalid response format: task deletion failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete assigned task');
    }
  }
);

export const bulkDeleteAssignTasksThunk = createAsyncThunk(
  'assignTasks/bulkDelete',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const response = await assignTaskService.bulkDeleteAssignTasks(ids);
      if (response.success) {
        return {
          deletedIds: ids,
          message: response.message,
          deletedCount: response.data?.deletedCount || 0
        };
      } else {
        return rejectWithValue('Invalid response format: bulk deletion failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete assigned tasks');
    }
  }
);

interface AssignTaskState {
  assignTasks: AssignTask[];
  singleAssignTask: AssignTask | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  selectedTasks: string[];
}

const initialState: AssignTaskState = {
  assignTasks: [],
  singleAssignTask: null,
  loading: false,
  error: null,
  successMessage: null,
  selectedTasks: [],
};

const assignTaskSlice = createSlice({
  name: 'assignTasks',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    selectTask(state, action: PayloadAction<string>) {
      if (!state.selectedTasks.includes(action.payload)) {
        state.selectedTasks.push(action.payload);
      }
    },
    deselectTask(state, action: PayloadAction<string>) {
      state.selectedTasks = state.selectedTasks.filter(id => id !== action.payload);
    },
    selectAllTasks(state, action: PayloadAction<string[]>) {
      state.selectedTasks = action.payload;
    },
    clearSelectedTasks(state) {
      state.selectedTasks = [];
    },
    toggleTaskSelection(state, action: PayloadAction<string>) {
      const taskId = action.payload;
      if (state.selectedTasks.includes(taskId)) {
        state.selectedTasks = state.selectedTasks.filter(id => id !== taskId);
      } else {
        state.selectedTasks.push(taskId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllAssignTasksThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.assignTasks = [];
      })
      .addCase(getAllAssignTasksThunk.fulfilled, (state, action: PayloadAction<AssignTask[]>) => {
        state.loading = false;
        state.assignTasks = action.payload;
      })
      .addCase(getAllAssignTasksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.assignTasks = [];
      })
      .addCase(getAssignTaskByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignTaskByIdThunk.fulfilled, (state, action: PayloadAction<AssignTask>) => {
        state.loading = false;
        state.singleAssignTask = action.payload;
      })
      .addCase(getAssignTaskByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAssignTaskByStaffIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.assignTasks = [];
      })
      .addCase(getAssignTaskByStaffIdThunk.fulfilled, (state, action: PayloadAction<AssignTask[]>) => {
        state.loading = false;
        state.assignTasks = action.payload;
      })
      .addCase(getAssignTaskByStaffIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.assignTasks = [];
      })
      .addCase(createAssignTaskThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignTaskThunk.fulfilled, (state, action: PayloadAction<AssignTask>) => {
        state.loading = false;
        state.assignTasks = [...state.assignTasks, action.payload];
        state.successMessage = 'Task assigned successfully';
      })
      .addCase(createAssignTaskThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.assignTasks = state.assignTasks.filter((task) => task._id !== action.meta.arg._id);
      })
      .addCase(updateAssignTaskThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssignTaskThunk.fulfilled, (state, action: PayloadAction<AssignTask>) => {
        state.loading = false;
        state.assignTasks = state.assignTasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        );
      })
      .addCase(updateAssignTaskThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAssignTaskThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssignTaskThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.assignTasks = state.assignTasks.filter((task) => task._id !== action.payload);
        state.successMessage = 'Task deleted successfully';
      })
      .addCase(deleteAssignTaskThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkDeleteAssignTasksThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteAssignTasksThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.assignTasks = state.assignTasks.filter((task) =>
          !action.payload.deletedIds.includes(task._id)
        );
        state.selectedTasks = [];
        state.successMessage = action.payload.message;
      })
      .addCase(bulkDeleteAssignTasksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  selectTask,
  deselectTask,
  selectAllTasks,
  clearSelectedTasks,
  toggleTaskSelection
} = assignTaskSlice.actions;
export default assignTaskSlice.reducer;