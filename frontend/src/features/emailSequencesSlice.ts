import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { emailSequencesApi } from '../services/api';

interface EmailSequenceStep {
  id: string;
  sequenceId: string;
  templateId?: string;
  name: string;
  delayDays: number;
  delayHours: number;
  sortOrder: number;
  template?: EmailTemplate;
}

interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  status: 'draft' | 'active' | 'paused';
  createdBy: string;
  creator?: any;
  steps?: EmailSequenceStep[];
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables: string[];
  createdBy: string;
  creator?: any;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface EmailSequencesState {
  sequences: EmailSequence[];
  currentSequence: EmailSequence | null;
  templates: EmailTemplate[];
  currentTemplate: EmailTemplate | null;
  pagination: PaginationMeta | null;
  templatesPagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmailSequencesState = {
  sequences: [],
  currentSequence: null,
  templates: [],
  currentTemplate: null,
  pagination: null,
  templatesPagination: null,
  isLoading: false,
  error: null,
};

export const fetchEmailSequences = createAsyncThunk(
  'emailSequences/fetchAll',
  async (params: { page?: number; limit?: number; status?: string; trigger?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch email sequences');
    }
  }
);

export const fetchEmailSequence = createAsyncThunk(
  'emailSequences/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch email sequence');
    }
  }
);

export const createEmailSequence = createAsyncThunk(
  'emailSequences/create',
  async (data: Partial<EmailSequence>, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create email sequence');
    }
  }
);

export const updateEmailSequence = createAsyncThunk(
  'emailSequences/update',
  async ({ id, data }: { id: string; data: Partial<EmailSequence> }, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update email sequence');
    }
  }
);

export const deleteEmailSequence = createAsyncThunk(
  'emailSequences/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await emailSequencesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete email sequence');
    }
  }
);

export const createSequenceStep = createAsyncThunk(
  'emailSequences/createStep',
  async ({ sequenceId, data }: { sequenceId: string; data: Partial<EmailSequenceStep> }, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.createStep(sequenceId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create sequence step');
    }
  }
);

export const updateSequenceStep = createAsyncThunk(
  'emailSequences/updateStep',
  async ({ sequenceId, stepId, data }: { sequenceId: string; stepId: string; data: Partial<EmailSequenceStep> }, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.updateStep(sequenceId, stepId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update sequence step');
    }
  }
);

export const deleteSequenceStep = createAsyncThunk(
  'emailSequences/deleteStep',
  async ({ sequenceId, stepId }: { sequenceId: string; stepId: string }, { rejectWithValue }) => {
    try {
      await emailSequencesApi.deleteStep(sequenceId, stepId);
      return stepId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete sequence step');
    }
  }
);

export const fetchEmailTemplates = createAsyncThunk(
  'emailSequences/fetchTemplates',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.getTemplates(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch email templates');
    }
  }
);

export const fetchEmailTemplate = createAsyncThunk(
  'emailSequences/fetchTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.getTemplate(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch email template');
    }
  }
);

export const createEmailTemplate = createAsyncThunk(
  'emailSequences/createTemplate',
  async (data: Partial<EmailTemplate>, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.createTemplate(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create email template');
    }
  }
);

export const updateEmailTemplate = createAsyncThunk(
  'emailSequences/updateTemplate',
  async ({ id, data }: { id: string; data: Partial<EmailTemplate> }, { rejectWithValue }) => {
    try {
      const response = await emailSequencesApi.updateTemplate(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update email template');
    }
  }
);

export const deleteEmailTemplate = createAsyncThunk(
  'emailSequences/deleteTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      await emailSequencesApi.deleteTemplate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete email template');
    }
  }
);

const emailSequencesSlice = createSlice({
  name: 'emailSequences',
  initialState,
  reducers: {
    clearCurrentSequence: (state) => {
      state.currentSequence = null;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailSequences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmailSequences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sequences = action.payload.sequences;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEmailSequences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmailSequence.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmailSequence.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSequence = action.payload;
      })
      .addCase(fetchEmailSequence.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createEmailSequence.fulfilled, (state, action) => {
        state.sequences.unshift(action.payload);
      })
      .addCase(updateEmailSequence.fulfilled, (state, action) => {
        const index = state.sequences.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.sequences[index] = action.payload;
        }
        if (state.currentSequence?.id === action.payload.id) {
          state.currentSequence = action.payload;
        }
      })
      .addCase(deleteEmailSequence.fulfilled, (state, action) => {
        state.sequences = state.sequences.filter((s) => s.id !== action.payload);
        if (state.currentSequence?.id === action.payload) {
          state.currentSequence = null;
        }
      })
      .addCase(createSequenceStep.fulfilled, (state, action) => {
        if (state.currentSequence) {
          state.currentSequence.steps = [...(state.currentSequence.steps || []), action.payload];
        }
      })
      .addCase(updateSequenceStep.fulfilled, (state, action) => {
        if (state.currentSequence?.steps) {
          const index = state.currentSequence.steps.findIndex((s) => s.id === action.payload.id);
          if (index !== -1) {
            state.currentSequence.steps[index] = action.payload;
          }
        }
      })
      .addCase(deleteSequenceStep.fulfilled, (state, action) => {
        if (state.currentSequence?.steps) {
          state.currentSequence.steps = state.currentSequence.steps.filter((s) => s.id !== action.payload);
        }
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        state.templates = action.payload.templates;
        state.templatesPagination = action.payload.pagination;
      })
      .addCase(fetchEmailTemplate.fulfilled, (state, action) => {
        state.currentTemplate = action.payload;
      })
      .addCase(createEmailTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(updateEmailTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.currentTemplate?.id === action.payload.id) {
          state.currentTemplate = action.payload;
        }
      })
      .addCase(deleteEmailTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t.id !== action.payload);
        if (state.currentTemplate?.id === action.payload) {
          state.currentTemplate = null;
        }
      });
  },
});

export const { clearCurrentSequence, clearCurrentTemplate, clearError } = emailSequencesSlice.actions;
export default emailSequencesSlice.reducer;
