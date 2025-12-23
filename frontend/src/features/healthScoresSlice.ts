import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { healthScoresApi } from '../services/api';

interface HealthScore {
  id: string;
  companyId?: string;
  contactId?: string;
  score: number;
  npsScore?: number;
  csatScore?: number;
  cesScore?: number;
  customSurveyScore?: number;
  engagementScore?: number;
  riskLevel: 'at_risk' | 'caution' | 'good' | 'excellent';
  calculatedAt: string;
  company?: any;
  contact?: any;
  updatedAt: string;
}

interface HealthScoreStats {
  byRiskLevel: Record<string, number>;
  averageScore: number;
  total: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface HealthScoresState {
  healthScores: HealthScore[];
  currentHealthScore: HealthScore | null;
  companyHealthScore: HealthScore | null;
  stats: HealthScoreStats | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: HealthScoresState = {
  healthScores: [],
  currentHealthScore: null,
  companyHealthScore: null,
  stats: null,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchHealthScores = createAsyncThunk(
  'healthScores/fetchAll',
  async (params: { page?: number; limit?: number; riskLevel?: string; companyId?: string; contactId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch health scores');
    }
  }
);

export const fetchHealthScore = createAsyncThunk(
  'healthScores/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch health score');
    }
  }
);

export const fetchCompanyHealthScore = createAsyncThunk(
  'healthScores/fetchByCompany',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.getByCompany(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch company health score');
    }
  }
);

export const createHealthScore = createAsyncThunk(
  'healthScores/create',
  async (data: Partial<HealthScore>, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create health score');
    }
  }
);

export const updateHealthScore = createAsyncThunk(
  'healthScores/update',
  async ({ id, data }: { id: string; data: Partial<HealthScore> }, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update health score');
    }
  }
);

export const recalculateHealthScore = createAsyncThunk(
  'healthScores/recalculate',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.recalculate(companyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to recalculate health score');
    }
  }
);

export const fetchHealthScoreStats = createAsyncThunk(
  'healthScores/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await healthScoresApi.getStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch health score stats');
    }
  }
);

const healthScoresSlice = createSlice({
  name: 'healthScores',
  initialState,
  reducers: {
    clearCurrentHealthScore: (state) => {
      state.currentHealthScore = null;
    },
    clearCompanyHealthScore: (state) => {
      state.companyHealthScore = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthScores.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthScores.fulfilled, (state, action) => {
        state.isLoading = false;
        state.healthScores = action.payload.healthScores;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchHealthScores.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHealthScore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthScore.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHealthScore = action.payload;
      })
      .addCase(fetchHealthScore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCompanyHealthScore.fulfilled, (state, action) => {
        state.companyHealthScore = action.payload;
      })
      .addCase(createHealthScore.fulfilled, (state, action) => {
        state.healthScores.unshift(action.payload);
      })
      .addCase(updateHealthScore.fulfilled, (state, action) => {
        const index = state.healthScores.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          state.healthScores[index] = action.payload;
        }
        if (state.currentHealthScore?.id === action.payload.id) {
          state.currentHealthScore = action.payload;
        }
      })
      .addCase(recalculateHealthScore.fulfilled, (state, action) => {
        state.companyHealthScore = action.payload;
        const index = state.healthScores.findIndex((h) => h.companyId === action.payload.companyId);
        if (index !== -1) {
          state.healthScores[index] = action.payload;
        }
      })
      .addCase(fetchHealthScoreStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentHealthScore, clearCompanyHealthScore, clearError } = healthScoresSlice.actions;
export default healthScoresSlice.reducer;
