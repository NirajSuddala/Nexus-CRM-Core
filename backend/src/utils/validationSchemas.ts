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
  domain: z.string().min(1, 'Domain is required'),
  industry: z.string().min(1, 'Industry is required'),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  revenue: z.number().positive('Revenue must be positive').optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

// Contact schemas
export const createContactSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  companyId: z.string().min(1, 'Company is required'),
  lifecycleStage: z.enum(['lead', 'mql', 'sql', 'customer']).optional().default('lead'),
});

export const updateContactSchema = createContactSchema.partial();

// Deal schemas
export const createDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.number().positive('Amount must be positive').min(1, 'Amount is required'),
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
  closeDate: z.string().min(1, 'Close date is required'),
  probability: z.number().min(0, 'Probability must be at least 0').max(100, 'Probability must be at most 100'),
  companyId: z.string().min(1, 'Company is required'),
  contactId: z.string().min(1, 'Contact is required'),
});

export const updateDealSchema = createDealSchema.partial();

export const updateDealStageSchema = z.object({
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
});

// Task schemas
export const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['todo', 'in_progress', 'completed']),
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
