import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { automationsApi } from '../services/api';

interface Automation {
  id: string;
  name: string;
  triggerType: 'event' | 'time' | 'manual';
  triggerConfig: Record<string, any>;
  actions: Array<{ type: string; [key: string]: any }>;
  status: 'active' | 'inactive';
  createdBy: string;
  creator?: any;
  createdAt: string;
  updatedAt: string;
}

interface AutomationStats {
  total: number;
  active: number;
  inactive: number;
  byTriggerType: Record<string, number>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AutomationsState {
  automations: Automation[];
  currentAutomation: Automation | null;
  stats: AutomationStats | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AutomationsState = {
  automations: [],
  currentAutomation: null,
  stats: null,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchAutomations = createAsyncThunk(
  'automations/fetchAll',
  async (params: { page?: number; limit?: number; status?: string; triggerType?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await automationsApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch automations');
    }
  }
);

export const fetchAutomation = createAsyncThunk(
  'automations/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await automationsApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch automation');
    }
  }
);

export const createAutomation = createAsyncThunk(
  'automations/create',
  async (data: Partial<Automation>, { rejectWithValue }) => {
    try {
      const response = await automationsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create automation');
    }
  }
);

export const updateAutomation = createAsyncThunk(
  'automations/update',
  async ({ id, data }: { id: string; data: Partial<Automation> }, { rejectWithValue }) => {
    try {
      const response = await automationsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update automation');
    }
  }
);

export const deleteAutomation = createAsyncThunk(
  'automations/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await automationsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete automation');
    }
  }
);

export const toggleAutomation = createAsyncThunk(
  'automations/toggle',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await automationsApi.toggle(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to toggle automation');
    }
  }
);

export const executeAutomation = createAsyncThunk(
  'automations/execute',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await automationsApi.execute(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to execute automation');
    }
  }
);

export const fetchAutomationStats = createAsyncThunk(
  'automations/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await automationsApi.getStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch automation stats');
    }
  }
);

const automationsSlice = createSlice({
  name: 'automations',
  initialState,
  reducers: {
    clearCurrentAutomation: (state) => {
      state.currentAutomation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutomations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAutomations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.automations = action.payload.automations;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAutomations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAutomation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAutomation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAutomation = action.payload;
      })
      .addCase(fetchAutomation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createAutomation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAutomation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.automations.unshift(action.payload);
      })
      .addCase(createAutomation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAutomation.fulfilled, (state, action) => {
        const index = state.automations.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.automations[index] = action.payload;
        }
        if (state.currentAutomation?.id === action.payload.id) {
          state.currentAutomation = action.payload;
        }
      })
      .addCase(deleteAutomation.fulfilled, (state, action) => {
        state.automations = state.automations.filter((a) => a.id !== action.payload);
        if (state.currentAutomation?.id === action.payload) {
          state.currentAutomation = null;
        }
      })
      .addCase(toggleAutomation.fulfilled, (state, action) => {
        const index = state.automations.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.automations[index] = action.payload;
        }
        if (state.currentAutomation?.id === action.payload.id) {
          state.currentAutomation = action.payload;
        }
      })
      .addCase(fetchAutomationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentAutomation, clearError } = automationsSlice.actions;
export default automationsSlice.reducer;
