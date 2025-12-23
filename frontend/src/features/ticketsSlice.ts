import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ticketsApi } from '../services/api';

interface Ticket {
  id: string;
  title: string;
  description?: string;
  type: 'bug' | 'feature_request' | 'support' | 'change_request' | 'question';
  status: 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  companyId?: string;
  contactId?: string;
  projectId?: string;
  assignedTo?: string;
  dueDate?: string;
  resolvedAt?: string;
  company?: any;
  contact?: any;
  project?: any;
  assignee?: any;
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface TicketsState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  stats: TicketStats | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  tickets: [],
  currentTicket: null,
  stats: null,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (params: { page?: number; limit?: number; search?: string; status?: string; priority?: string; type?: string; companyId?: string; contactId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await ticketsApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tickets');
    }
  }
);

export const fetchTicketStats = createAsyncThunk(
  'tickets/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ticketsApi.getStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch ticket stats');
    }
  }
);

export const fetchTicket = createAsyncThunk(
  'tickets/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await ticketsApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch ticket');
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (data: Partial<Ticket>, { rejectWithValue }) => {
    try {
      const response = await ticketsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create ticket');
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/update',
  async ({ id, data }: { id: string; data: Partial<Ticket> }, { rejectWithValue }) => {
    try {
      const response = await ticketsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update ticket');
    }
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await ticketsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete ticket');
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload.tickets;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTicketStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.tickets = state.tickets.filter((t) => t.id !== action.payload);
        if (state.currentTicket?.id === action.payload) {
          state.currentTicket = null;
        }
      });
  },
});

export const { clearCurrentTicket, clearError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
