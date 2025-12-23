import { Activity } from '../models';
import { ActivityType } from '../models/Activity';
import { Op } from 'sequelize';

interface CreateActivityData {
  type: ActivityType;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  taskId?: string | null;
  emailId?: string | null;
  createdBy: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  timestamp?: Date;
}

export const createActivity = async (data: CreateActivityData): Promise<Activity> => {
  return Activity.create({
    type: data.type,
    contactId: data.contactId || null,
    companyId: data.companyId || null,
    dealId: data.dealId || null,
    taskId: data.taskId || null,
    emailId: data.emailId || null,
    createdBy: data.createdBy,
    description: data.description || null,
    metadata: data.metadata || null,
    timestamp: data.timestamp || new Date(),
  });
};

export const getActivitiesForContact = async (
  contactId: string,
  limit = 20,
  offset = 0
) => {
  const { rows, count } = await Activity.findAndCountAll({
    where: { contactId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { activities: rows, total: count };
};

export const getActivitiesForCompany = async (
  companyId: string,
  limit = 20,
  offset = 0
) => {
  const { rows, count } = await Activity.findAndCountAll({
    where: { companyId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { activities: rows, total: count };
};

export const getActivitiesForDeal = async (
  dealId: string,
  limit = 20,
  offset = 0
) => {
  const { rows, count } = await Activity.findAndCountAll({
    where: { dealId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { activities: rows, total: count };
};

export const getRecentActivities = async (createdBy: string, limit = 50) => {
  return Activity.findAll({
    where: { createdBy },
    order: [['createdAt', 'DESC']],
    limit,
  });
};

// Activity helper functions for different entity types
export const logCompanyActivity = async (
  companyId: string,
  type: ActivityType,
  createdBy?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    type,
    companyId,
    createdBy: createdBy || 'system',
    description,
    metadata,
    timestamp: new Date(),
  });
};

export const logContactActivity = async (
  contactId: string,
  type: ActivityType,
  createdBy?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    type,
    contactId,
    createdBy: createdBy || 'system',
    description,
    metadata,
    timestamp: new Date(),
  });
};

export const logDealActivity = async (
  dealId: string,
  type: ActivityType,
  createdBy?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    type,
    dealId,
    createdBy: createdBy || 'system',
    description,
    metadata,
    timestamp: new Date(),
  });
};

export const logTaskActivity = async (
  taskId: string,
  type: ActivityType,
  createdBy?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    type,
    taskId,
    createdBy: createdBy || 'system',
    description,
    metadata,
    timestamp: new Date(),
  });
};
