import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pipelinesApi } from '../services/api';

interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  description?: string;
  sortOrder: number;
  color?: string;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  type: 'onboarding' | 'delivery' | 'support' | 'custom';
  isDefault: boolean;
  stages?: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PipelinesState {
  pipelines: Pipeline[];
  currentPipeline: Pipeline | null;
  stages: PipelineStage[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PipelinesState = {
  pipelines: [],
  currentPipeline: null,
  stages: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchPipelines = createAsyncThunk(
  'pipelines/fetchAll',
  async (params: { page?: number; limit?: number; type?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pipelines');
    }
  }
);

export const fetchPipeline = createAsyncThunk(
  'pipelines/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pipeline');
    }
  }
);

export const createPipeline = createAsyncThunk(
  'pipelines/create',
  async (data: Partial<Pipeline>, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create pipeline');
    }
  }
);

export const updatePipeline = createAsyncThunk(
  'pipelines/update',
  async ({ id, data }: { id: string; data: Partial<Pipeline> }, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update pipeline');
    }
  }
);

export const deletePipeline = createAsyncThunk(
  'pipelines/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await pipelinesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete pipeline');
    }
  }
);

export const fetchPipelineStages = createAsyncThunk(
  'pipelines/fetchStages',
  async (pipelineId: string, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.getStages(pipelineId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pipeline stages');
    }
  }
);

export const createPipelineStage = createAsyncThunk(
  'pipelines/createStage',
  async ({ pipelineId, data }: { pipelineId: string; data: Partial<PipelineStage> }, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.createStage(pipelineId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create pipeline stage');
    }
  }
);

export const updatePipelineStage = createAsyncThunk(
  'pipelines/updateStage',
  async ({ pipelineId, stageId, data }: { pipelineId: string; stageId: string; data: Partial<PipelineStage> }, { rejectWithValue }) => {
    try {
      const response = await pipelinesApi.updateStage(pipelineId, stageId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update pipeline stage');
    }
  }
);

export const deletePipelineStage = createAsyncThunk(
  'pipelines/deleteStage',
  async ({ pipelineId, stageId }: { pipelineId: string; stageId: string }, { rejectWithValue }) => {
    try {
      await pipelinesApi.deleteStage(pipelineId, stageId);
      return stageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete pipeline stage');
    }
  }
);

const pipelinesSlice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    clearCurrentPipeline: (state) => {
      state.currentPipeline = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPipelines.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPipelines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pipelines = action.payload.pipelines;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPipelines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPipeline.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPipeline.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPipeline = action.payload;
      })
      .addCase(fetchPipeline.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createPipeline.fulfilled, (state, action) => {
        state.pipelines.unshift(action.payload);
      })
      .addCase(updatePipeline.fulfilled, (state, action) => {
        const index = state.pipelines.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.pipelines[index] = action.payload;
        }
        if (state.currentPipeline?.id === action.payload.id) {
          state.currentPipeline = action.payload;
        }
      })
      .addCase(deletePipeline.fulfilled, (state, action) => {
        state.pipelines = state.pipelines.filter((p) => p.id !== action.payload);
        if (state.currentPipeline?.id === action.payload) {
          state.currentPipeline = null;
        }
      })
      .addCase(fetchPipelineStages.fulfilled, (state, action) => {
        state.stages = action.payload;
      })
      .addCase(createPipelineStage.fulfilled, (state, action) => {
        state.stages.push(action.payload);
        if (state.currentPipeline) {
          state.currentPipeline.stages = [...(state.currentPipeline.stages || []), action.payload];
        }
      })
      .addCase(updatePipelineStage.fulfilled, (state, action) => {
        const index = state.stages.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.stages[index] = action.payload;
        }
        if (state.currentPipeline?.stages) {
          const pipelineIndex = state.currentPipeline.stages.findIndex((s) => s.id === action.payload.id);
          if (pipelineIndex !== -1) {
            state.currentPipeline.stages[pipelineIndex] = action.payload;
          }
        }
      })
      .addCase(deletePipelineStage.fulfilled, (state, action) => {
        state.stages = state.stages.filter((s) => s.id !== action.payload);
        if (state.currentPipeline?.stages) {
          state.currentPipeline.stages = state.currentPipeline.stages.filter((s) => s.id !== action.payload);
        }
      });
  },
});

export const { clearCurrentPipeline, clearError } = pipelinesSlice.actions;
export default pipelinesSlice.reducer;
