import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi } from '../services/api';
import { DashboardStats, Deal } from '../types';

interface DealsByStageStats {
  stage: string;
  count: number;
  totalValue: number;
}

interface ContactsByLifecycleStats {
  lifecycleStage: string;
  count: number;
}

interface WinLossOverTimeStats {
  month: string;
  stage: string;
  count: number;
  totalValue: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  dealsByStageStats: DealsByStageStats[];
  contactsByLifecycleStats: ContactsByLifecycleStats[];
  recentDeals: Deal[];
  winLossOverTime: WinLossOverTimeStats[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  dealsByStageStats: [],
  contactsByLifecycleStats: [],
  recentDeals: [],
  winLossOverTime: [],
  isLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchDealsByStageStats = createAsyncThunk(
  'dashboard/fetchDealsByStage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getDealsByStage();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch deals by stage');
    }
  }
);

export const fetchContactsByLifecycleStats = createAsyncThunk(
  'dashboard/fetchContactsByLifecycle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getContactsByLifecycle();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts by lifecycle');
    }
  }
);

export const fetchRecentDeals = createAsyncThunk(
  'dashboard/fetchRecentDeals',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getRecentDeals(limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch recent deals');
    }
  }
);

export const fetchWinLossOverTime = createAsyncThunk(
  'dashboard/fetchWinLossOverTime',
  async (months: number = 6, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getWinLossOverTime(months);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch win/loss over time');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch deals by stage
      .addCase(fetchDealsByStageStats.fulfilled, (state, action) => {
        state.dealsByStageStats = action.payload;
      })
      // Fetch contacts by lifecycle
      .addCase(fetchContactsByLifecycleStats.fulfilled, (state, action) => {
        state.contactsByLifecycleStats = action.payload;
      })
      // Fetch recent deals
      .addCase(fetchRecentDeals.fulfilled, (state, action) => {
        state.recentDeals = action.payload;
      })
      // Fetch win/loss over time
      .addCase(fetchWinLossOverTime.fulfilled, (state, action) => {
        state.winLossOverTime = action.payload;
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
