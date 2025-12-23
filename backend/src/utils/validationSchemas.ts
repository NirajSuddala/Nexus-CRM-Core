import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'sales_rep']).optional().default('sales_rep'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  revenue: z.number().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lifecycleStage: z.string().optional().nullable(),
  customFields: z.any().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

// Contact schemas
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone is required'),
  title: z.string().min(1, 'Job title is required'),
  companyId: z.string().min(1, 'Company is required'),
  lifecycleStage: z.enum(['lead', 'mql', 'sql', 'customer']).default('lead'),
  customFields: z.any().optional().nullable(),
  properties: z.any().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

// Deal schemas
export const createDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.number().optional().nullable(),
  pipelineId: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  closeDate: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  properties: z.any().optional().nullable(),
});

export const updateDealSchema = createDealSchema.partial();

export const updateDealStageSchema = z.object({
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['open', 'in_progress', 'completed']).default('open'),
  contactId: z.string().min(1, 'Contact is required'),
  dealId: z.string().min(1, 'Deal is required'),
  assignedTo: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Note schemas
export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  entityType: z.enum(['contact', 'deal']),
  entityId: z.string().min(1, 'Entity ID is required'),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'companies', 'contacts', 'deals', 'tasks']).optional().default('all'),
});
