import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
interface DataItem {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface DynamicState {
  data: DataItem[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  
  // Dynamic states
  company: DataItem[];
  createdDate: DataItem[];
  party: DataItem[];
  contactPerson: DataItem[];
  partyTag: DataItem[];
  mobileNo: DataItem[];
  reasonToVisit: DataItem[];
  unitNo: DataItem[];
  market: DataItem[];
  area: DataItem[];
  remarks: DataItem[];
  status: DataItem[];
  createdBy: DataItem[];
  assignedTo: DataItem[];
}

// Initial State
const initialState: DynamicState = {
  data: [],
  loading: false,
  error: null,
  successMessage: null,
  company: [],
  createdAt: [],
  party: [],
  contactPerson: [],
  partyTag: [],
  mobile: [],
  reason: [],
  unitNo: [],
  market: [],
  area: [],
  remarks: [],
  status: [],
  createdBy: [],
  assignedTo: [],
};

// Slice
const dynamicSlice = createSlice({
  name: "dynamic",
  initialState,
  reducers: {
    // Add array to specific state
    addToState: <T extends keyof DynamicState>(
      state: DynamicState,
      action: PayloadAction<{ key: T; data: DynamicState[T] }>
    ) => {
      const { key, data } = action.payload;
      if (Array.isArray(state[key]) && Array.isArray(data)) {
        (state[key] as any) = data;
      }
      state.successMessage = `${key} data added successfully`;
    },

    // Append to existing state array
    appendToState: <T extends keyof DynamicState>(
      state: DynamicState,
      action: PayloadAction<{ key: T; data: any }>
    ) => {
      const { key, data } = action.payload;
      if (Array.isArray(state[key]) && Array.isArray(data)) {
        (state[key] as any).push(...data);
      } else if (Array.isArray(state[key])) {
        (state[key] as any).push(data);
      }
      state.successMessage = `Data appended to ${key} successfully`;
    },

    // Get specific state (read-only - no mutation needed)
    
    // Update item in specific state
    updateInState: <T extends keyof DynamicState>(
      state: DynamicState,
      action: PayloadAction<{ 
        key: T; 
        id: string; 
        updates: Partial<any> 
      }>
    ) => {
      const { key, id, updates } = action.payload;
      if (Array.isArray(state[key])) {
        const index = (state[key] as any).findIndex((item: any) => item._id === id);
        if (index !== -1) {
          (state[key] as any)[index] = { 
            ...(state[key] as any)[index], 
            ...updates 
          };
        }
      }
      state.successMessage = `Item updated in ${key} successfully`;
    },

    // Delete item from specific state
    deleteFromState: <T extends keyof DynamicState>(
      state: DynamicState,
      action: PayloadAction<{ key: T; id: string }>
    ) => {
      const { key, id } = action.payload;
      if (Array.isArray(state[key])) {
        (state[key] as any) = (state[key] as any).filter((item: any) => item._id !== id);
      }
      state.successMessage = `Item deleted from ${key} successfully`;
    },

    // Clear specific state
    clearState: <T extends keyof DynamicState>(
      state: DynamicState,
      action: PayloadAction<T>
    ) => {
      const key = action.payload;
      if (Array.isArray(state[key])) {
        (state[key] as any) = [];
      }
      state.successMessage = `${key} cleared successfully`;
    },

    // Utility Actions
    clearError(state) {
      state.error = null;
    },
    clearSuccessMessage(state) {
      state.successMessage = null;
    },
    resetAllStates(state) {
      Object.keys(state).forEach(key => {
        if (Array.isArray(state[key as keyof DynamicState])) {
          (state[key as keyof DynamicState] as any) = [];
        }
      });
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const { 
  addToState,
  appendToState,
  updateInState,
  deleteFromState,
  clearState,
  clearError,
  clearSuccessMessage,
  resetAllStates
} = dynamicSlice.actions;

export default dynamicSlice.reducer;