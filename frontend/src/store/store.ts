import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import companiesReducer from '../features/companiesSlice';
import contactsReducer from '../features/contactsSlice';
import dealsReducer from '../features/dealsSlice';
import tasksReducer from '../features/tasksSlice';
import dashboardReducer from '../features/dashboardSlice';
import uiReducer from '../features/uiSlice';
import projectsReducer from '../features/projectsSlice';
import ticketsReducer from '../features/ticketsSlice';
import surveysReducer from '../features/surveysSlice';
import healthScoresReducer from '../features/healthScoresSlice';
import emailSequencesReducer from '../features/emailSequencesSlice';
import automationsReducer from '../features/automationsSlice';
import pipelinesReducer from '../features/pipelinesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    companies: companiesReducer,
    contacts: contactsReducer,
    deals: dealsReducer,
    tasks: tasksReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
    projects: projectsReducer,
    tickets: ticketsReducer,
    surveys: surveysReducer,
    healthScores: healthScoresReducer,
    emailSequences: emailSequencesReducer,
    automations: automationsReducer,
    pipelines: pipelinesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
