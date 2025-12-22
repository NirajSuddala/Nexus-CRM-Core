import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface Modal {
  type: 'company' | 'contact' | 'deal' | 'task' | 'note' | 'confirm' | null;
  mode: 'create' | 'edit' | 'view' | null;
  data?: any;
}

interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  modal: Modal;
  searchOpen: boolean;
  searchQuery: string;
}

const initialState: UIState = {
  sidebarOpen: true,
  notifications: [],
  modal: {
    type: null,
    mode: null,
    data: null,
  },
  searchOpen: false,
  searchQuery: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<{ type: Modal['type']; mode: Modal['mode']; data?: any }>) => {
      state.modal = action.payload;
    },
    closeModal: (state) => {
      state.modal = { type: null, mode: null, data: null };
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  setSearchOpen,
  setSearchQuery,
} = uiSlice.actions;

export default uiSlice.reducer;
