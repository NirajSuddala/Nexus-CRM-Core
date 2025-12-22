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

    const { Deal, Task, Contact, Company } = await import('../models');
    const { Op } = await import('sequelize');

    // Total Deal Value in Pipeline (excluding closed deals)
    const pipelineValue = await Deal.sum('amount', {
      where: {
        stage: { [Op.notIn]: ['closed_won', 'closed_lost'] },
      },
    });

    // Won deals total
    const wonDealsValue = await Deal.sum('amount', {
      where: { stage: 'closed_won' },
    });

    // Lost deals total
    const lostDealsValue = await Deal.sum('amount', {
      where: { stage: 'closed_lost' },
    });

    // Win/Loss counts
    const wonDealsCount = await Deal.count({
      where: { stage: 'closed_won' },
    });

    const lostDealsCount = await Deal.count({
      where: { stage: 'closed_lost' },
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const stages = ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      const stats = stages.map(stage => {
        const stageDeals = demoDeals.filter(d => d.stage === stage);
        return {
          stage,
          count: stageDeals.length,
          totalValue: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        };
      });
      res.json(stats);
      return;
    }

    const { Deal } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const stats = await Deal.findAll({
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
      ],
      group: ['stage'],
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getContactsByLifecycleStats = async (
  req: Request,
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

    const { Deal, Company, Contact } = await import('../models');

    const deals = await Deal.findAll({
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'fullName'] },
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
        { month: new Date().toISOString(), stage: 'closed_won', count: 1, totalValue: 80000 },
        { month: new Date().toISOString(), stage: 'closed_lost', count: 1, totalValue: 35000 },
      ]);
      return;
    }

    const { Deal } = await import('../models');
    const { Op } = await import('sequelize');
    const sequelize = (await import('../config/database')).default;

    const months = parseInt(req.query.months as string) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const deals = await Deal.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalValue'],
      ],
      where: {
        stage: { [Op.in]: ['closed_won', 'closed_lost'] },
        createdAt: { [Op.gte]: startDate },
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'stage'],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']],
      raw: true,
    });

    res.json(deals);
  } catch (error) {
    next(error);
  }
};
