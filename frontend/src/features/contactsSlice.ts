import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contactsApi } from '../services/api';
import { Contact, ContactFormData, PaginationMeta, Activity, Note } from '../types';

interface ContactsState {
  contacts: Contact[];
  currentContact: Contact | null;
  activities: Activity[];
  notes: Note[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  contacts: [],
  currentContact: null,
  activities: [],
  notes: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchContacts = createAsyncThunk(
  'contacts/fetchAll',
  async (params: { page?: number; limit?: number; search?: string; companyId?: string; lifecycleStage?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await contactsApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts');
    }
  }
);

export const fetchContact = createAsyncThunk(
  'contacts/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await contactsApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch contact');
    }
  }
);

export const createContact = createAsyncThunk(
  'contacts/create',
  async (data: ContactFormData, { rejectWithValue }) => {
    try {
      const response = await contactsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create contact');
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/update',
  async ({ id, data }: { id: string; data: Partial<ContactFormData> }, { rejectWithValue }) => {
    try {
      const response = await contactsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update contact');
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contacts/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await contactsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete contact');
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    clearCurrentContact: (state) => {
      state.currentContact = null;
      state.activities = [];
      state.notes = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload.contacts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch one
      .addCase(fetchContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContact.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentContact = action.payload.contact;
        state.activities = action.payload.activities || [];
        state.notes = action.payload.notes || [];
      })
      .addCase(fetchContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts.unshift(action.payload);
        if (state.pagination) {
          state.pagination.total += 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit);
        }
      })
      .addCase(createContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.contacts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
        if (state.currentContact?.id === action.payload.id) {
          state.currentContact = action.payload;
        }
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = state.contacts.filter((c) => c.id !== action.payload);
        if (state.currentContact?.id === action.payload) {
          state.currentContact = null;
        }
        if (state.pagination && state.pagination.total > 0) {
          state.pagination.total -= 1;
          state.pagination.pages = Math.ceil(state.pagination.total / state.pagination.limit) || 1;
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentContact, clearError } = contactsSlice.actions;
export default contactsSlice.reducer;
