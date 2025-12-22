import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dealsApi } from '../services/api';
import { Deal, DealFormData, DealStage, PaginationMeta, Activity, Note } from '../types';

interface DealsByStage {
  discovery: Deal[];
  proposal: Deal[];
  negotiation: Deal[];
  closed_won: Deal[];
  closed_lost: Deal[];
}

interface DealsState {
  deals: Deal[];
  dealsByStage: DealsByStage;
  currentDeal: Deal | null;
  activities: Activity[];
  notes: Note[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DealsState = {
  deals: [],
  dealsByStage: {
    discovery: [],
    proposal: [],
    negotiation: [],
    closed_won: [],
    closed_lost: [],
  },
  currentDeal: null,
  activities: [],
  notes: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchDeals = createAsyncThunk(
  'deals/fetchAll',
  async (params: { page?: number; limit?: number; search?: string; stage?: string; companyId?: string; contactId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await dealsApi.getAll(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch deals');
    }
  }
);

export const fetchDealsByStage = createAsyncThunk(
  'deals/fetchByStage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dealsApi.getByStage();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch deals by stage');
    }
  }
);

export const fetchDeal = createAsyncThunk(
  'deals/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await dealsApi.getOne(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch deal');
    }
  }
);

export const createDeal = createAsyncThunk(
  'deals/create',
  async (data: DealFormData, { rejectWithValue }) => {
    try {
      const response = await dealsApi.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create deal');
    }
  }
);

export const updateDeal = createAsyncThunk(
  'deals/update',
  async ({ id, data }: { id: string; data: Partial<DealFormData> }, { rejectWithValue }) => {
    try {
      const response = await dealsApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update deal');
    }
  }
);

export const updateDealStage = createAsyncThunk(
  'deals/updateStage',
  async ({ id, stage }: { id: string; stage: DealStage }, { rejectWithValue }) => {
    try {
      const response = await dealsApi.updateStage(id, stage);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update deal stage');
    }
  }
);

export const deleteDeal = createAsyncThunk(
  'deals/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await dealsApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete deal');
    }
  }
);

const dealsSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {
    clearCurrentDeal: (state) => {
      state.currentDeal = null;
      state.activities = [];
      state.notes = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    // For real-time updates
    addDeal: (state, action: PayloadAction<Deal>) => {
      const deal = action.payload;
      state.deals.unshift(deal);
      if (deal.stage) {
        state.dealsByStage[deal.stage].unshift(deal);
      }
    },
    updateDealInState: (state, action: PayloadAction<Deal>) => {
      const deal = action.payload;
      const index = state.deals.findIndex((d) => d.id === deal.id);
      if (index !== -1) {
        state.deals[index] = deal;
      }
      // Update in dealsByStage
      Object.keys(state.dealsByStage).forEach((stage) => {
        const stageKey = stage as DealStage;
        state.dealsByStage[stageKey] = state.dealsByStage[stageKey].filter((d) => d.id !== deal.id);
      });
      if (deal.stage) {
        state.dealsByStage[deal.stage].push(deal);
      }
    },
    removeDealFromState: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.deals = state.deals.filter((d) => d.id !== id);
      Object.keys(state.dealsByStage).forEach((stage) => {
        const stageKey = stage as DealStage;
        state.dealsByStage[stageKey] = state.dealsByStage[stageKey].filter((d) => d.id !== id);
      });
    },
    moveDealToStage: (state, action: PayloadAction<{ dealId: string; fromStage: DealStage; toStage: DealStage }>) => {
      const { dealId, fromStage, toStage } = action.payload;
      const dealIndex = state.dealsByStage[fromStage].findIndex((d) => d.id === dealId);
      if (dealIndex !== -1) {
        const deal = { ...state.dealsByStage[fromStage][dealIndex], stage: toStage };
        state.dealsByStage[fromStage].splice(dealIndex, 1);
        state.dealsByStage[toStage].push(deal);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchDeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deals = action.payload.deals;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch by stage
      .addCase(fetchDealsByStage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDealsByStage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dealsByStage = action.payload;
      })
      .addCase(fetchDealsByStage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch one
      .addCase(fetchDeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDeal = action.payload.deal;
        state.activities = action.payload.activities || [];
        state.notes = action.payload.notes || [];
      })
      .addCase(fetchDeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createDeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDeal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deals.unshift(action.payload);
        if (action.payload.stage) {
          state.dealsByStage[action.payload.stage].unshift(action.payload);
        }
      })
      .addCase(createDeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateDeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDeal.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.deals.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.deals[index] = action.payload;
        }
        if (state.currentDeal?.id === action.payload.id) {
          state.currentDeal = action.payload;
        }
      })
      .addCase(updateDeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update stage
      .addCase(updateDealStage.fulfilled, (state, action) => {
        const deal = action.payload;
        const index = state.deals.findIndex((d) => d.id === deal.id);
        if (index !== -1) {
          const oldStage = state.deals[index].stage;
          state.deals[index] = deal;
          // Update dealsByStage
          state.dealsByStage[oldStage] = state.dealsByStage[oldStage].filter((d) => d.id !== deal.id);
          state.dealsByStage[deal.stage].push(deal);
        }
      })
      // Delete
      .addCase(deleteDeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.isLoading = false;
        const deal = state.deals.find((d) => d.id === action.payload);
        state.deals = state.deals.filter((d) => d.id !== action.payload);
        if (deal?.stage) {
          state.dealsByStage[deal.stage] = state.dealsByStage[deal.stage].filter((d) => d.id !== action.payload);
        }
        if (state.currentDeal?.id === action.payload) {
          state.currentDeal = null;
        }
      })
      .addCase(deleteDeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentDeal, clearError, addDeal, updateDealInState, removeDealFromState, moveDealToStage } = dealsSlice.actions;
export default dealsSlice.reducer;
