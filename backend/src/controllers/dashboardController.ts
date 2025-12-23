import { Request, Response, NextFunction } from 'express';
import { isDatabaseConnected } from '../config/database';
import { demoDashboardStats, demoDeals, demoContacts } from '../services/demoData';

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Return demo data if database is not connected
    if (!isDatabaseConnected) {
      res.json(demoDashboardStats);
      return;
    }

    const { Deal, Task, Contact, Company, PipelineStage } = await import('../models');
    const { Op } = await import('sequelize');

    // Get closed stages
    const closedWonStages = await PipelineStage.findAll({ where: { name: 'Closed Won' } });
    const closedLostStages = await PipelineStage.findAll({ where: { name: 'Closed Lost' } });
    const closedWonIds = closedWonStages.map(s => s.id);
    const closedLostIds = closedLostStages.map(s => s.id);
    const closedIds = [...closedWonIds, ...closedLostIds];

    // Total Deal Value in Pipeline (excluding closed deals)
    const pipelineValue = await Deal.sum('amount', {
      where: {
        stageId: { [Op.notIn]: closedIds },
      },
    });

    // Won deals total
    const wonDealsValue = await Deal.sum('amount', {
      where: { stageId: { [Op.in]: closedWonIds } },
    });

    // Lost deals total
    const lostDealsValue = await Deal.sum('amount', {
      where: { stageId: { [Op.in]: closedLostIds } },
    });

    // Win/Loss counts
    const wonDealsCount = await Deal.count({
      where: { stageId: { [Op.in]: closedWonIds } },
    });

    const lostDealsCount = await Deal.count({
      where: { stageId: { [Op.in]: closedLostIds } },
    });

    // Total counts
    const totalCompanies = await Company.count();
    const totalContacts = await Contact.count();
    const totalDeals = await Deal.count();
    const totalTasks = await Task.count();

    // Upcoming tasks for the week
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingTasksCount = await Task.count({
      where: {
        status: { [Op.ne]: 'completed' },
        dueDate: {
          [Op.between]: [today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]],
        },
      },
    });

    // Overdue tasks
    const overdueTasksCount = await Task.count({
      where: {
        status: { [Op.ne]: 'completed' },
        dueDate: { [Op.lt]: today.toISOString().split('T')[0] },
      },
    });

    res.json({
      pipelineValue: pipelineValue || 0,
      wonDealsValue: wonDealsValue || 0,
      lostDealsValue: lostDealsValue || 0,
      wonDealsCount,
      lostDealsCount,
      winRate: wonDealsCount + lostDealsCount > 0
        ? Math.round((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100)
        : 0,
      totalCompanies,
      totalContacts,
      totalDeals,
      totalTasks,
      upcomingTasksCount,
      overdueTasksCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getDealsByStageStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      // Group by stageName for demo data
      const stageGroups: Record<string, { count: number; totalValue: number }> = {};
      demoDeals.forEach(deal => {
        const stageName = deal.stageName || 'Unknown';
        if (!stageGroups[stageName]) {
          stageGroups[stageName] = { count: 0, totalValue: 0 };
        }
        stageGroups[stageName].count++;
        stageGroups[stageName].totalValue += deal.amount || 0;
      });

      const stats = Object.entries(stageGroups).map(([stage, data]) => ({
        stage,
        count: data.count,
        totalValue: data.totalValue,
      }));
      res.json(stats);
      return;
    }

    const { Deal, PipelineStage } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const stats = await Deal.findAll({
      attributes: [
        'stageId',
        [sequelize.fn('COUNT', sequelize.col('Deal.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
      ],
      include: [{ model: PipelineStage, as: 'stage', attributes: ['name'] }],
      group: ['Deal.stageId', 'stage.id'],
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getContactsByLifecycleStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const stages = ['lead', 'mql', 'sql', 'customer'];
      const stats = stages.map(stage => ({
        lifecycleStage: stage,
        count: demoContacts.filter(c => c.lifecycleStage === stage).length,
      }));
      res.json(stats);
      return;
    }

    const { Contact } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const stats = await Contact.findAll({
      attributes: [
        'lifecycleStage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['lifecycleStage'],
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getRecentDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    if (!isDatabaseConnected) {
      res.json(demoDeals.slice(0, limit));
      return;
    }

    const { Deal, Company, Contact, PipelineStage } = await import('../models');

    const deals = await Deal.findAll({
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });

    res.json(deals);
  } catch (error) {
    next(error);
  }
};

export const getWinLossOverTime = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      // Return demo win/loss data
      res.json([
        { month: new Date().toISOString(), stageName: 'Closed Won', count: 1, totalValue: 80000 },
        { month: new Date().toISOString(), stageName: 'Closed Lost', count: 1, totalValue: 35000 },
      ]);
      return;
    }

    const { Deal, PipelineStage } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;

    const months = parseInt(req.query.months as string) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get closed stage IDs
    const closedStages = await PipelineStage.findAll({
      where: { name: { [Op.in]: ['Closed Won', 'Closed Lost'] } },
    });
    const closedStageIds = closedStages.map(s => s.id);

    const deals = await Deal.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('Deal.created_at')), 'month'],
        'stageId',
        [sequelize.fn('COUNT', sequelize.col('Deal.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
      ],
      include: [{ model: PipelineStage, as: 'stage', attributes: ['name'] }],
      where: {
        stageId: { [Op.in]: closedStageIds },
        createdAt: { [Op.gte]: startDate },
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('Deal.created_at')), 'Deal.stageId', 'stage.id'],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('Deal.created_at')), 'ASC']],
      raw: true,
    });

    res.json(deals);
  } catch (error) {
    next(error);
  }
};
