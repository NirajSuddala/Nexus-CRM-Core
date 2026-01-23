import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface PersistentNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'deal' | 'project' | 'system';
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface Modal {
  type: 'company' | 'contact' | 'deal' | 'task' | 'note' | 'confirm' | 'project' | 'ticket' | 'survey' | 'automation' | 'emailSequence' | 'pipeline' | null;
  mode: 'create' | 'edit' | 'view' | null;
  data?: any;
}

interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  persistentNotifications: PersistentNotification[];
  modal: Modal;
  searchOpen: boolean;
  searchQuery: string;
}

const initialState: UIState = {
  sidebarOpen: true,
  notifications: [],
  persistentNotifications: [
    {
      id: '1',
      type: 'task',
      title: 'Task Reminder',
      message: 'Follow up with John Doe is due today',
      link: '/tasks',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'deal',
      title: 'Deal Update',
      message: 'Enterprise Software License moved to Negotiation',
      link: '/deals',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'project',
      title: 'Project Milestone',
      message: 'Website Redesign reached 75% completion',
      link: '/projects',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
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
    addPersistentNotification: (state, action: PayloadAction<Omit<PersistentNotification, 'id' | 'isRead' | 'createdAt'>>) => {
      const id = Date.now().toString();
      state.persistentNotifications.unshift({
        ...action.payload,
        id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.persistentNotifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.persistentNotifications.forEach((n) => {
        n.isRead = true;
      });
    },
    removePersistentNotification: (state, action: PayloadAction<string>) => {
      state.persistentNotifications = state.persistentNotifications.filter((n) => n.id !== action.payload);
    },
    clearPersistentNotifications: (state) => {
      state.persistentNotifications = [];
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
  addPersistentNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removePersistentNotification,
  clearPersistentNotifications,
  openModal,
  closeModal,
  setSearchOpen,
  setSearchQuery,
} = uiSlice.actions;

export default uiSlice.reducer;
