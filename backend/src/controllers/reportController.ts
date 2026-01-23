import { Request, Response, NextFunction } from 'express';
import { isDatabaseConnected } from '../config/database';
import { demoContacts, demoDeals, demoTasks, demoCompanies, demoActivities } from '../services/demoData';

// Helper to parse date range
const getDateRange = (range: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (range) {
    case 'last7days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last90days':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : now;
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
};

// Deal Reports
export const getDealsByStageReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = 'last30days', startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      // Demo mode - aggregate deals by stage
      const stageGroups: Record<string, { count: number; totalValue: number; amounts: number[] }> = {};
      demoDeals.forEach(deal => {
        const stageName = deal.stageName || 'Unknown';
        if (!stageGroups[stageName]) {
          stageGroups[stageName] = { count: 0, totalValue: 0, amounts: [] };
        }
        stageGroups[stageName].count++;
        stageGroups[stageName].totalValue += deal.amount || 0;
        stageGroups[stageName].amounts.push(deal.amount || 0);
      });

      const stats = Object.entries(stageGroups).map(([stage, data]) => ({
        stage,
        count: data.count,
        totalValue: data.totalValue,
        avgValue: data.amounts.length > 0 ? data.totalValue / data.amounts.length : 0,
      }));

      res.json({
        data: stats,
        dateRange: { start, end },
      });
      return;
    }

    const { Deal, PipelineStage } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;

    const stats = await Deal.findAll({
      attributes: [
        'stageId',
        [sequelize.fn('COUNT', sequelize.col('Deal.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'avgValue'],
      ],
      include: [{ model: PipelineStage, as: 'stage', attributes: ['name'] }],
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      group: ['Deal.stageId', 'stage.id'],
      raw: true,
    });

    res.json({
      data: stats,
      dateRange: { start, end },
    });
  } catch (error) {
    next(error);
  }
};

export const getDealValueOverTime = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = 'last90days', startDate, endDate, interval = 'month' } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      // Demo mode - generate sample time series data
      const now = new Date();
      const periods: { period: string; count: number; totalValue: number }[] = [];

      // Generate last 3 periods of data
      for (let i = 2; i >= 0; i--) {
        const periodDate = new Date(now);
        if (interval === 'month') {
          periodDate.setMonth(periodDate.getMonth() - i);
        } else if (interval === 'week') {
          periodDate.setDate(periodDate.getDate() - i * 7);
        } else {
          periodDate.setDate(periodDate.getDate() - i);
        }

        periods.push({
          period: periodDate.toISOString(),
          count: Math.floor(demoDeals.length * (i + 1) / 3),
          totalValue: demoDeals.reduce((sum, d) => sum + (d.amount || 0), 0) * (i + 1) / 3,
        });
      }

      res.json({
        data: periods,
        dateRange: { start, end },
        interval,
      });
      return;
    }

    const { Deal } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;
    const truncFn = interval === 'week' ? 'week' : interval === 'day' ? 'day' : 'month';

    const stats = await Deal.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', truncFn, sequelize.col('created_at')), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
      ],
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      group: [sequelize.fn('DATE_TRUNC', truncFn, sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE_TRUNC', truncFn, sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({
      data: stats,
      dateRange: { start, end },
      interval,
    });
  } catch (error) {
    next(error);
  }
};

export const getWinLossReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = 'last90days', startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      const wonDeals = demoDeals.filter(d => d.stageName === 'Closed Won');
      const lostDeals = demoDeals.filter(d => d.stageName === 'Closed Lost');

      const summary = [
        {
          stage: 'Closed Won',
          count: wonDeals.length,
          totalValue: wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        },
        {
          stage: 'Closed Lost',
          count: lostDeals.length,
          totalValue: lostDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        },
      ];

      res.json({
        topWonDeals: wonDeals.slice(0, 10),
        topLostDeals: lostDeals.slice(0, 10),
        summary,
        dateRange: { start, end },
      });
      return;
    }

    const { Deal, Company, PipelineStage } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;

    // Get closed stage IDs
    const closedWonStages = await PipelineStage.findAll({ where: { name: 'Closed Won' } });
    const closedLostStages = await PipelineStage.findAll({ where: { name: 'Closed Lost' } });
    const closedWonIds = closedWonStages.map(s => s.id);
    const closedLostIds = closedLostStages.map(s => s.id);

    const [won, lost, summary] = await Promise.all([
      Deal.findAll({
        where: {
          stageId: { [Op.in]: closedWonIds },
          updatedAt: { [Op.between]: [start, end] },
        },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
        ],
        order: [['amount', 'DESC']],
        limit: 10,
      }),
      Deal.findAll({
        where: {
          stageId: { [Op.in]: closedLostIds },
          updatedAt: { [Op.between]: [start, end] },
        },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
        ],
        order: [['amount', 'DESC']],
        limit: 10,
      }),
      Deal.findAll({
        attributes: [
          'stageId',
          [sequelize.fn('COUNT', sequelize.col('Deal.id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
        ],
        include: [{ model: PipelineStage, as: 'stage', attributes: ['name'] }],
        where: {
          stageId: { [Op.in]: [...closedWonIds, ...closedLostIds] },
          updatedAt: { [Op.between]: [start, end] },
        },
        group: ['Deal.stageId', 'stage.id'],
        raw: true,
      }),
    ]);

    res.json({
      topWonDeals: won,
      topLostDeals: lost,
      summary,
      dateRange: { start, end },
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesForecast = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const pipelineDeals = demoDeals.filter(
        d => !['Closed Won', 'Closed Lost'].includes(d.stageName)
      );

      // Transform deals to match frontend expected format
      const forecast = pipelineDeals.map(deal => {
        const contact = deal.contactId ? demoContacts.find(c => c.id === deal.contactId) : null;
        const company = deal.companyId ? demoCompanies.find(c => c.id === deal.companyId) : null;

        return {
          ...deal,
          stage: deal.stageName?.toLowerCase().replace(' ', '_') || 'discovery',
          closeDate: deal.expectedCloseDate,
          company: company || deal.company,
          contact: contact ? { ...contact, fullName: contact.fullName || `${contact.firstName} ${contact.lastName}` } : deal.contact,
          weightedValue: (deal.amount || 0) * (deal.probability / 100),
        };
      });

      const totalWeightedValue = forecast.reduce((sum, deal) => sum + deal.weightedValue, 0);
      const totalPipelineValue = pipelineDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

      res.json({
        deals: forecast,
        totalPipelineValue,
        totalWeightedValue,
        avgProbability: pipelineDeals.length > 0
          ? Math.round(pipelineDeals.reduce((sum, deal) => sum + deal.probability, 0) / pipelineDeals.length)
          : 0,
      });
      return;
    }

    const { Deal, Company, PipelineStage } = await import('../models');
    const { Op } = await import('sequelize');

    // Get closed stage IDs to exclude
    const closedStages = await PipelineStage.findAll({
      where: { name: { [Op.in]: ['Closed Won', 'Closed Lost'] } },
    });
    const closedStageIds = closedStages.map(s => s.id);

    const deals = await Deal.findAll({
      where: {
        stageId: { [Op.notIn]: closedStageIds },
        expectedCloseDate: { [Op.not]: null },
      },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
      order: [['expectedCloseDate', 'ASC']],
    });

    // Calculate weighted pipeline value
    const forecast = deals.map((deal) => ({
      ...deal.toJSON(),
      weightedValue: (deal.amount || 0) * ((deal.probability || 0) / 100),
    }));

    const totalWeightedValue = forecast.reduce((sum, deal) => sum + deal.weightedValue, 0);
    const totalPipelineValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

    res.json({
      deals: forecast,
      totalPipelineValue,
      totalWeightedValue,
      avgProbability: deals.length > 0
        ? Math.round(deals.reduce((sum, deal) => sum + (deal.probability || 0), 0) / deals.length)
        : 0,
    });
  } catch (error) {
    next(error);
  }
};

// Contact Reports
export const getContactsByLifecycleReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = 'last30days', startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      // Demo mode - aggregate contacts by lifecycle stage
      const stageGroups: Record<string, number> = {};
      demoContacts.forEach(contact => {
        const stage = contact.lifecycleStage || 'lead';
        stageGroups[stage] = (stageGroups[stage] || 0) + 1;
      });

      const stats = Object.entries(stageGroups).map(([lifecycleStage, count]) => ({
        lifecycleStage,
        count,
      }));

      res.json({
        data: stats,
        dateRange: { start, end },
      });
      return;
    }

    const { Contact } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;

    const stats = await Contact.findAll({
      attributes: [
        'lifecycleStage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      group: ['lifecycleStage'],
      raw: true,
    });

    res.json({
      data: stats,
      dateRange: { start, end },
    });
  } catch (error) {
    next(error);
  }
};

export const getContactGrowth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = 'last90days', startDate, endDate, interval = 'month' } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      // Demo mode - generate sample growth data
      const now = new Date();
      const periods: { period: string; count: number }[] = [];

      for (let i = 2; i >= 0; i--) {
        const periodDate = new Date(now);
        if (interval === 'month') {
          periodDate.setMonth(periodDate.getMonth() - i);
        } else if (interval === 'week') {
          periodDate.setDate(periodDate.getDate() - i * 7);
        } else {
          periodDate.setDate(periodDate.getDate() - i);
        }

        periods.push({
          period: periodDate.toISOString(),
          count: Math.ceil(demoContacts.length * (3 - i) / 3),
        });
      }

      res.json({
        data: periods,
        dateRange: { start, end },
        interval,
      });
      return;
    }

    const { Contact } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;
    const truncFn = interval === 'week' ? 'week' : interval === 'day' ? 'day' : 'month';

    const stats = await Contact.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', truncFn, sequelize.col('created_at')), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      group: [sequelize.fn('DATE_TRUNC', truncFn, sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE_TRUNC', truncFn, sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({
      data: stats,
      dateRange: { start, end },
      interval,
    });
  } catch (error) {
    next(error);
  }
};

export const getContactsByCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!isDatabaseConnected) {
      // Demo mode - count contacts per company
      const companyCounts: Record<string, { id: string; name: string; contactCount: number }> = {};

      demoCompanies.forEach(company => {
        companyCounts[company.id] = {
          id: company.id,
          name: company.name,
          contactCount: 0,
        };
      });

      demoContacts.forEach(contact => {
        if (contact.companyId && companyCounts[contact.companyId]) {
          companyCounts[contact.companyId].contactCount++;
        }
      });

      const stats = Object.values(companyCounts)
        .sort((a, b) => b.contactCount - a.contactCount);

      res.json({
        data: stats,
        pagination: { page, limit },
      });
      return;
    }

    const { Company, Contact } = await import('../models');
    const sequelize = (await import('../config/database')).default;
    const offset = (page - 1) * limit;

    const stats = await Company.findAll({
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('contacts.id')), 'contactCount'],
      ],
      include: [
        { model: Contact, as: 'contacts', attributes: [] },
      ],
      group: ['Company.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('contacts.id')), 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    res.json({
      data: stats,
      pagination: { page, limit },
    });
  } catch (error) {
    next(error);
  }
};

// Activity Reports
export const getTaskCompletionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { range = 'last30days', startDate, endDate } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      // Demo mode - aggregate tasks by status
      const statusGroups: Record<string, number> = {};
      demoTasks.forEach(task => {
        statusGroups[task.status] = (statusGroups[task.status] || 0) + 1;
      });

      const stats = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        count,
      }));

      const total = demoTasks.length;
      const completed = statusGroups['completed'] || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      res.json({
        data: stats,
        total,
        completionRate,
        dateRange: { start, end },
      });
      return;
    }

    const { Task } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;

    const stats = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      group: ['status'],
      raw: true,
    }) as unknown as Array<{ status: string; count: string }>;

    const total = stats.reduce((sum: number, s) => sum + parseInt(s.count), 0);
    const completed = stats.find((s) => s.status === 'completed');
    const completionRate = total > 0 ? Math.round((parseInt(completed?.count || '0') / total) * 100) : 0;

    res.json({
      data: stats,
      total,
      completionRate,
      dateRange: { start, end },
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { range = 'last7days', startDate, endDate, entityType, activityType, contactId, companyId, dealId } = req.query as any;
    const { start, end } = getDateRange(range, startDate, endDate);

    if (!isDatabaseConnected) {
      let filtered = [...demoActivities];

      // Filter by entityType (frontend sends this)
      if (entityType) {
        filtered = filtered.filter(a => {
          if (entityType === 'contact') return a.contactId != null;
          if (entityType === 'company') return a.companyId != null;
          if (entityType === 'deal') return a.dealId != null;
          if (entityType === 'task') return a.taskId != null;
          return true;
        });
      }
      // Also support activityType for backwards compatibility
      if (activityType) {
        filtered = filtered.filter(a => a.type === activityType);
      }
      if (contactId) {
        filtered = filtered.filter(a => a.contactId === contactId);
      }
      if (companyId) {
        filtered = filtered.filter(a => a.companyId === companyId);
      }
      if (dealId) {
        filtered = filtered.filter(a => a.dealId === dealId);
      }

      // Transform activities to match frontend expected format
      const transformedActivities = filtered.map(activity => {
        // Determine entityType from which ID field is set
        let derivedEntityType = 'contact';
        let entityId = activity.contactId;
        if (activity.dealId) {
          derivedEntityType = 'deal';
          entityId = activity.dealId;
        } else if (activity.companyId) {
          derivedEntityType = 'company';
          entityId = activity.companyId;
        } else if (activity.taskId) {
          derivedEntityType = 'task';
          entityId = activity.taskId;
        }

        // Map activity type to action
        const actionMap: Record<string, string> = {
          'note': 'note_added',
          'task': 'task_completed',
          'email': 'email_sent',
          'call': 'call_logged',
          'meeting': 'meeting_scheduled',
        };

        return {
          ...activity,
          entityType: derivedEntityType,
          entityId: entityId,
          action: actionMap[activity.type] || activity.type,
          createdAt: activity.createdAt || activity.timestamp,
        };
      });

      res.json({
        data: transformedActivities,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
        dateRange: { start, end },
      });
      return;
    }

    const { Activity } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {
      createdAt: { [Op.between]: [start, end] },
    };
    if (activityType) where.type = activityType;
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (dealId) where.dealId = dealId;

    const { rows: activities, count } = await Activity.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      data: activities,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
      dateRange: { start, end },
    });
  } catch (error) {
    next(error);
  }
};
