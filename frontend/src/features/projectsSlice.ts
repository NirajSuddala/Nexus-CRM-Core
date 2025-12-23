import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectsApi } from '../services/api';

interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  sortOrder: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  contactId?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  progress: number;
  createdBy: string;
  milestones?: Milestone[];
  company?: any;
  contact?: any;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  milestones: Milestone[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  milestones: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (params: { page?: number; limit?: number; search?: string; status?: string; companyId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await projectsApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch projects');
    }
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await projectsApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (data: Partial<Project>, { rejectWithValue }) => {
    try {
      const response = await projectsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, data }: { id: string; data: Partial<Project> }, { rejectWithValue }) => {
    try {
      const response = await projectsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete project');
    }
  }
);

export const fetchMilestones = createAsyncThunk(
  'projects/fetchMilestones',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await projectsApi.getMilestones(projectId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch milestones');
    }
  }
);

export const createMilestone = createAsyncThunk(
  'projects/createMilestone',
  async ({ projectId, data }: { projectId: string; data: Partial<Milestone> }, { rejectWithValue }) => {
    try {
      const response = await projectsApi.createMilestone(projectId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create milestone');
    }
  }
);

export const updateMilestone = createAsyncThunk(
  'projects/updateMilestone',
  async ({ projectId, milestoneId, data }: { projectId: string; milestoneId: string; data: Partial<Milestone> }, { rejectWithValue }) => {
    try {
      const response = await projectsApi.updateMilestone(projectId, milestoneId, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update milestone');
    }
  }
);

export const deleteMilestone = createAsyncThunk(
  'projects/deleteMilestone',
  async ({ projectId, milestoneId }: { projectId: string; milestoneId: string }, { rejectWithValue }) => {
    try {
      await projectsApi.deleteMilestone(projectId, milestoneId);
      return milestoneId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete milestone');
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload);
        if (state.pagination) {
          state.pagination.total += 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
        }
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
        if (state.pagination && state.pagination.total > 0) {
          state.pagination.total -= 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
        }
      })
      .addCase(fetchMilestones.fulfilled, (state, action) => {
        state.milestones = action.payload;
      })
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.milestones.push(action.payload);
      })
      .addCase(updateMilestone.fulfilled, (state, action) => {
        const index = state.milestones.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.milestones[index] = action.payload;
        }
      })
      .addCase(deleteMilestone.fulfilled, (state, action) => {
        state.milestones = state.milestones.filter((m) => m.id !== action.payload);
      });
  },
});

export const { clearCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
