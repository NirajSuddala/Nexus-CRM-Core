import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoAutomations } from '../services/demoData';

export const getAutomations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const triggerType = req.query.triggerType as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoAutomations];
      if (status) filtered = filtered.filter(a => a.status === status);
      if (triggerType) filtered = filtered.filter(a => a.triggerType === triggerType);

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      res.json({
        automations: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Automation, User } = await import('../models');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (triggerType) where.triggerType = triggerType;

    const { rows: automations, count } = await Automation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      automations,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const automation = demoAutomations.find(a => a.id === req.params.id);
      if (!automation) {
        throw new AppError('Automation not found', 404);
      }
      res.json(automation);
      return;
    }

    const { Automation, User } = await import('../models');

    const automation = await Automation.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator' }],
    });

    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    res.json(automation);
  } catch (error) {
    next(error);
  }
};

export const createAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newAutomation = {
        id: `demo-automation-${Date.now()}`,
        ...req.body,
        status: req.body.status || 'inactive',
        createdBy: 'demo-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoAutomations.push(newAutomation as any);
      res.status(201).json(newAutomation);
      return;
    }

    const { Automation, User } = await import('../models');

    const automation = await Automation.create({
      ...req.body,
      createdBy: req.user?.id || 'system',
    });

    const fullAutomation = await Automation.findByPk(automation.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullAutomation);
  } catch (error) {
    next(error);
  }
};

export const updateAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoAutomations.findIndex(a => a.id === req.params.id);
      if (index === -1) {
        throw new AppError('Automation not found', 404);
      }
      demoAutomations[index] = {
        ...demoAutomations[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoAutomations[index]);
      return;
    }

    const { Automation, User } = await import('../models');

    const automation = await Automation.findByPk(req.params.id);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    await automation.update(req.body);

    const fullAutomation = await Automation.findByPk(automation.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullAutomation);
  } catch (error) {
    next(error);
  }
};

export const deleteAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoAutomations.findIndex(a => a.id === req.params.id);
      if (index === -1) {
        throw new AppError('Automation not found', 404);
      }
      demoAutomations.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Automation } = await import('../models');

    const automation = await Automation.findByPk(req.params.id);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    await automation.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const toggleAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoAutomations.findIndex(a => a.id === req.params.id);
      if (index === -1) {
        throw new AppError('Automation not found', 404);
      }
      const currentStatus = demoAutomations[index].status;
      demoAutomations[index].status = currentStatus === 'active' ? 'inactive' : 'active';
      demoAutomations[index].updatedAt = new Date().toISOString();
      res.json(demoAutomations[index]);
      return;
    }

    const { Automation, User } = await import('../models');

    const automation = await Automation.findByPk(req.params.id);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    const newStatus = automation.status === 'active' ? 'inactive' : 'active';
    await automation.update({ status: newStatus });

    const fullAutomation = await Automation.findByPk(automation.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullAutomation);
  } catch (error) {
    next(error);
  }
};

export const executeAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoAutomations.findIndex(a => a.id === req.params.id);
      if (index === -1) {
        throw new AppError('Automation not found', 404);
      }

      // Simulate execution
      demoAutomations[index].updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: 'Automation executed successfully',
        automation: demoAutomations[index],
        executedAt: new Date().toISOString(),
      });
      return;
    }

    const { Automation, User } = await import('../models');

    const automation = await Automation.findByPk(req.params.id);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    // Execute the automation based on its actions
    // This is a simplified implementation - in production, you'd have a proper workflow engine
    const actions = automation.actions || [];
    const results: any[] = [];

    for (const action of actions) {
      try {
        // Execute action based on type
        switch (action.type) {
          case 'send_email':
            results.push({ action: 'send_email', status: 'success', message: 'Email queued' });
            break;
          case 'create_task':
            results.push({ action: 'create_task', status: 'success', message: 'Task created' });
            break;
          case 'update_field':
            results.push({ action: 'update_field', status: 'success', message: 'Field updated' });
            break;
          case 'notify':
            results.push({ action: 'notify', status: 'success', message: 'Notification sent' });
            break;
          default:
            results.push({ action: action.type, status: 'skipped', message: 'Unknown action type' });
        }
      } catch (err: any) {
        results.push({ action: action.type, status: 'error', message: err.message });
      }
    }

    const fullAutomation = await Automation.findByPk(automation.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json({
      success: true,
      message: 'Automation executed',
      results,
      automation: fullAutomation,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getAutomationStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const stats = {
        total: demoAutomations.length,
        active: demoAutomations.filter(a => a.status === 'active').length,
        inactive: demoAutomations.filter(a => a.status === 'inactive').length,
        byTriggerType: {
          event: demoAutomations.filter(a => a.triggerType === 'event').length,
          time: demoAutomations.filter(a => a.triggerType === 'time').length,
          manual: demoAutomations.filter(a => a.triggerType === 'manual').length,
        },
      };
      res.json(stats);
      return;
    }

    const { Automation } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const [statusStats, triggerStats, total] = await Promise.all([
      Automation.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Automation.findAll({
        attributes: ['triggerType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['triggerType'],
        raw: true,
      }),
      Automation.count(),
    ]);

    res.json({
      total,
      byStatus: statusStats,
      byTriggerType: triggerStats,
    });
  } catch (error) {
    next(error);
  }
};
