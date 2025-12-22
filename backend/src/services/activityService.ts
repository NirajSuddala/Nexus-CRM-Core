import { Activity } from '../models';
import { EntityType } from '../models/Activity';
import { Op } from 'sequelize';

interface CreateActivityData {
  entityType: EntityType;
  entityId: string;
  userId?: string;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
}

export const createActivity = async (data: CreateActivityData): Promise<Activity> => {
  return Activity.create(data);
};

export const getActivitiesForEntity = async (
  entityType: EntityType,
  entityId: string,
  limit = 20,
  offset = 0
) => {
  const { rows, count } = await Activity.findAndCountAll({
    where: {
      entityType,
      entityId,
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { activities: rows, total: count };
};

export const getActivitiesForEntities = async (
  entityType: EntityType,
  entityIds: string[],
  limit = 20,
  offset = 0
) => {
  const { rows, count } = await Activity.findAndCountAll({
    where: {
      entityType,
      entityId: { [Op.in]: entityIds },
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { activities: rows, total: count };
};

export const getRecentActivities = async (userId: string, limit = 50) => {
  return Activity.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
  });
};

// Activity helper functions for different entity types
export const logCompanyActivity = async (
  companyId: string,
  action: string,
  userId?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    entityType: 'company',
    entityId: companyId,
    userId,
    action,
    description,
    metadata,
  });
};

export const logContactActivity = async (
  contactId: string,
  action: string,
  userId?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    entityType: 'contact',
    entityId: contactId,
    userId,
    action,
    description,
    metadata,
  });
};

export const logDealActivity = async (
  dealId: string,
  action: string,
  userId?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    entityType: 'deal',
    entityId: dealId,
    userId,
    action,
    description,
    metadata,
  });
};

export const logTaskActivity = async (
  taskId: string,
  action: string,
  userId?: string,
  description?: string,
  metadata?: Record<string, any>
) => {
  return createActivity({
    entityType: 'task',
    entityId: taskId,
    userId,
    action,
    description,
    metadata,
  });
};
