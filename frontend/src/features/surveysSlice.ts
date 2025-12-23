import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { surveysApi } from '../services/api';

interface Survey {
  id: string;
  name: string;
  description?: string;
  type: 'nps' | 'csat' | 'ces' | 'custom';
  questions: any[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  triggerEvent?: string;
  sendAfterDays?: number;
  createdBy: string;
  creator?: any;
  createdAt: string;
  updatedAt: string;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  companyId?: string;
  contactId?: string;
  score?: number;
  answers: any;
  submittedAt: string;
  company?: any;
  contact?: any;
}

interface SurveyStats {
  totalResponses: number;
  averageScore: number;
  npsScore?: number;
  responsesByScore?: Record<number, number>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface SurveysState {
  surveys: Survey[];
  currentSurvey: Survey | null;
  responses: SurveyResponse[];
  stats: SurveyStats | null;
  pagination: PaginationMeta | null;
  responsesPagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SurveysState = {
  surveys: [],
  currentSurvey: null,
  responses: [],
  stats: null,
  pagination: null,
  responsesPagination: null,
  isLoading: false,
  error: null,
};

export const fetchSurveys = createAsyncThunk(
  'surveys/fetchAll',
  async (params: { page?: number; limit?: number; type?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await surveysApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch surveys');
    }
  }
);

export const fetchSurvey = createAsyncThunk(
  'surveys/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await surveysApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch survey');
    }
  }
);

export const createSurvey = createAsyncThunk(
  'surveys/create',
  async (data: Partial<Survey>, { rejectWithValue }) => {
    try {
      const response = await surveysApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create survey');
    }
  }
);

export const updateSurvey = createAsyncThunk(
  'surveys/update',
  async ({ id, data }: { id: string; data: Partial<Survey> }, { rejectWithValue }) => {
    try {
      const response = await surveysApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update survey');
    }
  }
);

export const deleteSurvey = createAsyncThunk(
  'surveys/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await surveysApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete survey');
    }
  }
);

export const fetchSurveyResponses = createAsyncThunk(
  'surveys/fetchResponses',
  async ({ surveyId, params }: { surveyId: string; params?: { page?: number; limit?: number } }, { rejectWithValue }) => {
    try {
      const response = await surveysApi.getResponses(surveyId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch survey responses');
    }
  }
);

export const createSurveyResponse = createAsyncThunk(
  'surveys/createResponse',
  async ({ surveyId, data }: { surveyId: string; data: Partial<SurveyResponse> }, { rejectWithValue }) => {
    try {
      const response = await surveysApi.createResponse(surveyId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to submit survey response');
    }
  }
);

export const fetchSurveyStats = createAsyncThunk(
  'surveys/fetchStats',
  async (surveyId: string, { rejectWithValue }) => {
    try {
      const response = await surveysApi.getStats(surveyId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch survey stats');
    }
  }
);

const surveysSlice = createSlice({
  name: 'surveys',
  initialState,
  reducers: {
    clearCurrentSurvey: (state) => {
      state.currentSurvey = null;
      state.responses = [];
      state.stats = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSurveys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSurveys.fulfilled, (state, action) => {
        state.isLoading = false;
        state.surveys = action.payload.surveys;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSurveys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSurvey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSurvey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSurvey = action.payload;
      })
      .addCase(fetchSurvey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createSurvey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSurvey.fulfilled, (state, action) => {
        state.isLoading = false;
        state.surveys.unshift(action.payload);
      })
      .addCase(createSurvey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSurvey.fulfilled, (state, action) => {
        const index = state.surveys.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.surveys[index] = action.payload;
        }
        if (state.currentSurvey?.id === action.payload.id) {
          state.currentSurvey = action.payload;
        }
      })
      .addCase(deleteSurvey.fulfilled, (state, action) => {
        state.surveys = state.surveys.filter((s) => s.id !== action.payload);
        if (state.currentSurvey?.id === action.payload) {
          state.currentSurvey = null;
        }
      })
      .addCase(fetchSurveyResponses.fulfilled, (state, action) => {
        state.responses = action.payload.responses;
        state.responsesPagination = action.payload.pagination;
      })
      .addCase(createSurveyResponse.fulfilled, (state, action) => {
        state.responses.unshift(action.payload);
      })
      .addCase(fetchSurveyStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearCurrentSurvey, clearError } = surveysSlice.actions;
export default surveysSlice.reducer;
