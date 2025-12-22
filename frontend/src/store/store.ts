import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import companiesReducer from '../features/companiesSlice';
import contactsReducer from '../features/contactsSlice';
import dealsReducer from '../features/dealsSlice';
import tasksReducer from '../features/tasksSlice';
import dashboardReducer from '../features/dashboardSlice';
import uiReducer from '../features/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    companies: companiesReducer,
    contacts: contactsReducer,
    deals: dealsReducer,
    tasks: tasksReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
