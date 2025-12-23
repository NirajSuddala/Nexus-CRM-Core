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

// Projects API
export const projectsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; companyId?: string }) =>
    api.get('/projects', { params }),
  getOne: (id: string) =>
    api.get(`/projects/${id}`),
  create: (data: any) =>
    api.post('/projects', data),
  update: (id: string, data: any) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
  getMilestones: (projectId: string) =>
    api.get(`/projects/${projectId}/milestones`),
  createMilestone: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (projectId: string, milestoneId: string, data: any) =>
    api.put(`/projects/${projectId}/milestones/${milestoneId}`, data),
  deleteMilestone: (projectId: string, milestoneId: string) =>
    api.delete(`/projects/${projectId}/milestones/${milestoneId}`),
};

// Tickets API
export const ticketsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string; type?: string; companyId?: string; contactId?: string }) =>
    api.get('/tickets', { params }),
  getStats: () =>
    api.get('/tickets/stats'),
  getOne: (id: string) =>
    api.get(`/tickets/${id}`),
  create: (data: any) =>
    api.post('/tickets', data),
  update: (id: string, data: any) =>
    api.put(`/tickets/${id}`, data),
  delete: (id: string) =>
    api.delete(`/tickets/${id}`),
};

// Surveys API
export const surveysApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get('/surveys', { params }),
  getOne: (id: string) =>
    api.get(`/surveys/${id}`),
  create: (data: any) =>
    api.post('/surveys', data),
  update: (id: string, data: any) =>
    api.put(`/surveys/${id}`, data),
  delete: (id: string) =>
    api.delete(`/surveys/${id}`),
  getResponses: (surveyId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/surveys/${surveyId}/responses`, { params }),
  createResponse: (surveyId: string, data: any) =>
    api.post(`/surveys/${surveyId}/responses`, data),
  getStats: (surveyId: string) =>
    api.get(`/surveys/${surveyId}/stats`),
};

// Health Scores API
export const healthScoresApi = {
  getAll: (params?: { page?: number; limit?: number; riskLevel?: string; companyId?: string; contactId?: string }) =>
    api.get('/health-scores', { params }),
  getOne: (id: string) =>
    api.get(`/health-scores/${id}`),
  getByCompany: (companyId: string) =>
    api.get(`/health-scores/company/${companyId}`),
  create: (data: any) =>
    api.post('/health-scores', data),
  update: (id: string, data: any) =>
    api.put(`/health-scores/${id}`, data),
  recalculate: (companyId: string) =>
    api.post(`/health-scores/company/${companyId}/recalculate`),
  getStats: () =>
    api.get('/health-scores/stats'),
};

// Email Sequences API
export const emailSequencesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; trigger?: string }) =>
    api.get('/email-sequences', { params }),
  getOne: (id: string) =>
    api.get(`/email-sequences/${id}`),
  create: (data: any) =>
    api.post('/email-sequences', data),
  update: (id: string, data: any) =>
    api.put(`/email-sequences/${id}`, data),
  delete: (id: string) =>
    api.delete(`/email-sequences/${id}`),
  getSteps: (sequenceId: string) =>
    api.get(`/email-sequences/${sequenceId}/steps`),
  createStep: (sequenceId: string, data: any) =>
    api.post(`/email-sequences/${sequenceId}/steps`, data),
  updateStep: (sequenceId: string, stepId: string, data: any) =>
    api.put(`/email-sequences/${sequenceId}/steps/${stepId}`, data),
  deleteStep: (sequenceId: string, stepId: string) =>
    api.delete(`/email-sequences/${sequenceId}/steps/${stepId}`),
  getTemplates: (params?: { page?: number; limit?: number }) =>
    api.get('/email-sequences/templates', { params }),
  getTemplate: (id: string) =>
    api.get(`/email-sequences/templates/${id}`),
  createTemplate: (data: any) =>
    api.post('/email-sequences/templates', data),
  updateTemplate: (id: string, data: any) =>
    api.put(`/email-sequences/templates/${id}`, data),
  deleteTemplate: (id: string) =>
    api.delete(`/email-sequences/templates/${id}`),
};

// Automations API
export const automationsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; triggerType?: string }) =>
    api.get('/automations', { params }),
  getOne: (id: string) =>
    api.get(`/automations/${id}`),
  create: (data: any) =>
    api.post('/automations', data),
  update: (id: string, data: any) =>
    api.put(`/automations/${id}`, data),
  delete: (id: string) =>
    api.delete(`/automations/${id}`),
  toggle: (id: string) =>
    api.post(`/automations/${id}/toggle`),
  execute: (id: string) =>
    api.post(`/automations/${id}/execute`),
  getStats: () =>
    api.get('/automations/stats'),
};

// Pipelines API
export const pipelinesApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/pipelines', { params }),
  getOne: (id: string) =>
    api.get(`/pipelines/${id}`),
  create: (data: any) =>
    api.post('/pipelines', data),
  update: (id: string, data: any) =>
    api.put(`/pipelines/${id}`, data),
  delete: (id: string) =>
    api.delete(`/pipelines/${id}`),
  getStages: (pipelineId: string) =>
    api.get(`/pipelines/${pipelineId}/stages`),
  createStage: (pipelineId: string, data: any) =>
    api.post(`/pipelines/${pipelineId}/stages`, data),
  updateStage: (pipelineId: string, stageId: string, data: any) =>
    api.put(`/pipelines/${pipelineId}/stages/${stageId}`, data),
  deleteStage: (pipelineId: string, stageId: string) =>
    api.delete(`/pipelines/${pipelineId}/stages/${stageId}`),
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
