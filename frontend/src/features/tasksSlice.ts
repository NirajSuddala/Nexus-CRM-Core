import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksApi } from '../services/api';
import { Task, TaskFormData, PaginationMeta } from '../types';

interface TasksState {
  tasks: Task[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
  currentTask: Task | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  upcomingTasks: [],
  overdueTasks: [],
  currentTask: null,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (params: { page?: number; limit?: number; search?: string; status?: string; priority?: string; assignedTo?: string; contactId?: string; dealId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await tasksApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tasks');
    }
  }
);

export const fetchUpcomingTasks = createAsyncThunk(
  'tasks/fetchUpcoming',
  async (days: number = 7, { rejectWithValue }) => {
    try {
      const response = await tasksApi.getUpcoming(days);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch upcoming tasks');
    }
  }
);

export const fetchOverdueTasks = createAsyncThunk(
  'tasks/fetchOverdue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tasksApi.getOverdue();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch overdue tasks');
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await tasksApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch task');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (data: TaskFormData, { rejectWithValue }) => {
    try {
      const response = await tasksApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, data }: { id: string; data: Partial<TaskFormData> }, { rejectWithValue }) => {
    try {
      const response = await tasksApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await tasksApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete task');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch upcoming
      .addCase(fetchUpcomingTasks.fulfilled, (state, action) => {
        state.upcomingTasks = action.payload;
      })
      // Fetch overdue
      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.overdueTasks = action.payload;
      })
      // Fetch one
      .addCase(fetchTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.unshift(action.payload);
        if (state.pagination) {
          state.pagination.total += 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
        if (state.pagination && state.pagination.total > 0) {
          state.pagination.total -= 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentTask, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
