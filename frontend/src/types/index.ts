// User types
export type UserRole = 'admin' | 'sales_rep';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Company types
export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  linkedinUrl: string | null;
  revenue: number | null;
  contacts?: Contact[];
  deals?: Deal[];
  createdAt: string;
  updatedAt: string;
}

// Contact types
export type LifecycleStage = 'lead' | 'mql' | 'sql' | 'customer';

export interface Contact {
  id: string;
  companyId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  lifecycleStage: LifecycleStage;
  company?: Company;
  deals?: Deal[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

// Deal types
export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Deal {
  id: string;
  companyId: string | null;
  contactId: string | null;
  name: string;
  amount: number | null;
  stage: DealStage;
  closeDate: string | null;
  probability: number;
  company?: Company;
  contact?: Contact;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

// Task types
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  contactId: string | null;
  dealId: string | null;
  assignedTo: string | null;
  name: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  description: string | null;
  contact?: Contact;
  deal?: Deal;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
}

// Activity types
export type EntityType = 'company' | 'contact' | 'deal' | 'task';

export interface Activity {
  id: string;
  entityType: EntityType;
  entityId: string;
  userId: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, any> | null;
  user?: User;
  createdAt: string;
}

// Note types
export type NoteEntityType = 'contact' | 'deal';

export interface Note {
  id: string;
  entityType: NoteEntityType;
  entityId: string;
  userId: string | null;
  content: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Dashboard types
export interface DashboardStats {
  pipelineValue: number;
  wonDealsValue: number;
  lostDealsValue: number;
  wonDealsCount: number;
  lostDealsCount: number;
  winRate: number;
  totalCompanies: number;
  totalContacts: number;
  totalDeals: number;
  totalTasks: number;
  upcomingTasksCount: number;
  overdueTasksCount: number;
}

// Search types
export interface SearchResults {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface CompanyFormData {
  name: string;
  domain?: string | null;
  industry?: string | null;
  linkedinUrl?: string | null;
  revenue?: number | null;
}

export interface ContactFormData {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  lifecycleStage?: LifecycleStage;
}

export interface DealFormData {
  name: string;
  amount?: number | null;
  stage?: DealStage;
  closeDate?: string | null;
  probability?: number;
  companyId?: string | null;
  contactId?: string | null;
}

export interface TaskFormData {
  name: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  contactId?: string | null;
  dealId?: string | null;
  assignedTo?: string | null;
}

export interface NoteFormData {
  content: string;
  entityType: NoteEntityType;
  entityId: string;
}
