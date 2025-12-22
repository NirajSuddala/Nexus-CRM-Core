import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { email: string; password: string; fullName: string; role?: string }) =>
    api.post('/auth/register', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Companies API
export const companiesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/companies', { params }),
  getOne: (id: string) =>
    api.get(`/companies/${id}`),
  create: (data: any) =>
    api.post('/companies', data),
  update: (id: string, data: any) =>
    api.put(`/companies/${id}`, data),
  delete: (id: string) =>
    api.delete(`/companies/${id}`),
};

// Contacts API
export const contactsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; companyId?: string; lifecycleStage?: string }) =>
    api.get('/contacts', { params }),
  getOne: (id: string) =>
    api.get(`/contacts/${id}`),
  create: (data: any) =>
    api.post('/contacts', data),
  update: (id: string, data: any) =>
    api.put(`/contacts/${id}`, data),
  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
};

// Deals API
export const dealsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; stage?: string; companyId?: string; contactId?: string }) =>
    api.get('/deals', { params }),
  getByStage: () =>
    api.get('/deals/by-stage'),
  getOne: (id: string) =>
    api.get(`/deals/${id}`),
  create: (data: any) =>
    api.post('/deals', data),
  update: (id: string, data: any) =>
    api.put(`/deals/${id}`, data),
  updateStage: (id: string, stage: string) =>
    api.patch(`/deals/${id}/stage`, { stage }),
  delete: (id: string) =>
    api.delete(`/deals/${id}`),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string; assignedTo?: string; contactId?: string; dealId?: string }) =>
    api.get('/tasks', { params }),
  getUpcoming: (days?: number) =>
    api.get('/tasks/upcoming', { params: { days } }),
  getOverdue: () =>
    api.get('/tasks/overdue'),
  getStats: () =>
    api.get('/tasks/stats'),
  getOne: (id: string) =>
    api.get(`/tasks/${id}`),
  create: (data: any) =>
    api.post('/tasks', data),
  update: (id: string, data: any) =>
    api.put(`/tasks/${id}`, data),
  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
};

// Notes API
export const notesApi = {
  getAll: (entityType: string, entityId: string) =>
    api.get('/notes', { params: { entityType, entityId } }),
  create: (data: { content: string; entityType: string; entityId: string }) =>
    api.post('/notes', data),
  update: (id: string, content: string) =>
    api.put(`/notes/${id}`, { content }),
  delete: (id: string) =>
    api.delete(`/notes/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get('/dashboard/stats'),
  getDealsByStage: () =>
    api.get('/dashboard/deals-by-stage'),
  getContactsByLifecycle: () =>
    api.get('/dashboard/contacts-by-lifecycle'),
  getRecentDeals: (limit?: number) =>
    api.get('/dashboard/recent-deals', { params: { limit } }),
  getWinLossOverTime: (months?: number) =>
    api.get('/dashboard/win-loss-over-time', { params: { months } }),
};

// Search API
export const searchApi = {
  global: (q: string, type?: string, limit?: number) =>
    api.get('/search', { params: { q, type, limit } }),
};

// Reports API
export const reportsApi = {
  getDealsByStage: (params?: { range?: string; startDate?: string; endDate?: string }) =>
    api.get('/reports/deals/by-stage', { params }),
  getDealValueOverTime: (params?: { range?: string; startDate?: string; endDate?: string; interval?: string }) =>
    api.get('/reports/deals/value-over-time', { params }),
  getWinLoss: (params?: { range?: string; startDate?: string; endDate?: string }) =>
    api.get('/reports/deals/win-loss', { params }),
  getSalesForecast: () =>
    api.get('/reports/deals/forecast'),
  getContactsByLifecycle: (params?: { range?: string; startDate?: string; endDate?: string }) =>
    api.get('/reports/contacts/by-lifecycle', { params }),
  getContactGrowth: (params?: { range?: string; startDate?: string; endDate?: string; interval?: string }) =>
    api.get('/reports/contacts/growth', { params }),
  getContactsByCompany: (params?: { page?: number; limit?: number }) =>
    api.get('/reports/contacts/by-company', { params }),
  getTaskCompletion: (params?: { range?: string; startDate?: string; endDate?: string }) =>
    api.get('/reports/tasks/completion', { params }),
  getActivityLog: (params?: { page?: number; limit?: number; range?: string; startDate?: string; endDate?: string; entityType?: string; action?: string }) =>
    api.get('/reports/activity-log', { params }),
};

export default api;
