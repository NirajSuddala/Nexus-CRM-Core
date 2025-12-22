import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { companiesApi } from '../services/api';
import { Company, CompanyFormData, PaginationMeta } from '../types';

interface CompaniesState {
  companies: Company[];
  currentCompany: Company | null;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CompaniesState = {
  companies: [],
  currentCompany: null,
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchCompanies = createAsyncThunk(
  'companies/fetchAll',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await companiesApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch companies');
    }
  }
);

export const fetchCompany = createAsyncThunk(
  'companies/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await companiesApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch company');
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/create',
  async (data: CompanyFormData, { rejectWithValue }) => {
    try {
      const response = await companiesApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create company');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/update',
  async ({ id, data }: { id: string; data: Partial<CompanyFormData> }, { rejectWithValue }) => {
    try {
      const response = await companiesApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update company');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await companiesApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete company');
    }
  }
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    clearCurrentCompany: (state) => {
      state.currentCompany = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = action.payload.companies;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch one
      .addCase(fetchCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCompany = action.payload.company;
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies.unshift(action.payload);
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.companies.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
        if (state.currentCompany?.id === action.payload.id) {
          state.currentCompany = action.payload;
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete
      .addCase(deleteCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = state.companies.filter((c) => c.id !== action.payload);
        if (state.currentCompany?.id === action.payload) {
          state.currentCompany = null;
        }
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentCompany, clearError } = companiesSlice.actions;
export default companiesSlice.reducer;
