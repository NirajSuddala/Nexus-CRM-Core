import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoDeals, demoCompanies, demoContacts, demoTasks, demoActivities, demoDealsByStage } from '../services/demoData';

export const getDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string || '').toLowerCase();
    const stageId = req.query.stageId as string;
    const companyId = req.query.companyId as string;
    const contactId = req.query.contactId as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoDeals];
      if (search) {
        filtered = filtered.filter(d => d.name.toLowerCase().includes(search));
      }
      if (stageId) filtered = filtered.filter(d => d.stageId === stageId);
      if (companyId) filtered = filtered.filter(d => d.companyId === companyId);
      if (contactId) filtered = filtered.filter(d => d.contactId === contactId);

      res.json({
        deals: filtered,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Deal, Company, Contact, PipelineStage } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (stageId) where.stageId = stageId;
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;

    const { rows: deals, count } = await Deal.findAndCountAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      deals,
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

export const getDealsByStage = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      res.json(demoDealsByStage);
      return;
    }

    const { Deal, Company, Contact, PipelineStage } = await import('../models');

    // Get all stages and group deals by stage name
    const stages = await PipelineStage.findAll({ order: [['sortOrder', 'ASC']] });
    const result: Record<string, any[]> = {};

    for (const stage of stages) {
      const deals = await Deal.findAll({
        where: { stageId: stage.id },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
          { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
      });
      result[stage.name.toLowerCase().replace(' ', '_')] = deals;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const deal = demoDeals.find(d => d.id === req.params.id);
      if (!deal) {
        throw new AppError('Deal not found', 404);
      }

      const dealWithRelations = {
        ...deal,
        tasks: demoTasks.filter(t => t.dealId === deal.id),
      };

      const activities = demoActivities.filter(a => a.dealId === deal.id);

      res.json({ deal: dealWithRelations, activities });
      return;
    }

    const { Deal, Company, Contact, Task, Activity, PipelineStage } = await import('../models');

    const deal = await Deal.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'company' },
        { model: Contact, as: 'contact' },
        { model: Task, as: 'tasks' },
        { model: PipelineStage, as: 'stage' },
      ],
    });

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    const activities = await Activity.findAll({
      where: { dealId: deal.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.json({ deal, activities });
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newDeal = {
        id: `demo-deal-${Date.now()}`,
        ...req.body,
        stageId: req.body.stageId || 'demo-stage-1',
        probability: req.body.probability || 20,
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : null,
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoDeals.push(newDeal as any);
      res.status(201).json(newDeal);
      return;
    }

    const { Deal, Company, Contact, PipelineStage } = await import('../models');
    const { logDealActivity } = await import('../services/activityService');

    const deal = await Deal.create(req.body);

    await logDealActivity(
      deal.id,
      'created',
      req.user?.id,
      `Deal "${deal.name}" was created`
    );

    const fullDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
    });

    // Emit socket event for real-time updates
    try {
      const { getIO } = await import('../socket');
      const io = getIO();
      io.emit('deal:created', fullDeal);
    } catch (e) {
      // Socket not initialized yet
    }

    res.status(201).json(fullDeal);
  } catch (error) {
    next(error);
  }
};

export const updateDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoDeals.findIndex(d => d.id === req.params.id);
      if (index === -1) {
        throw new AppError('Deal not found', 404);
      }
      const oldStage = demoDeals[index].stage;
      demoDeals[index] = {
        ...demoDeals[index],
        ...req.body,
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : demoDeals[index].company,
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : demoDeals[index].contact,
        updatedAt: new Date().toISOString()
      };
      // Update demoDealsByStage if stage changed
      if (req.body.stage && req.body.stage !== oldStage) {
        demoDealsByStage[oldStage] = demoDealsByStage[oldStage].filter(d => d.id !== req.params.id);
        if (demoDealsByStage[req.body.stage]) {
          demoDealsByStage[req.body.stage].unshift(demoDeals[index]);
        }
      } else {
        // Update the deal in its current stage
        const stageIndex = demoDealsByStage[oldStage].findIndex(d => d.id === req.params.id);
        if (stageIndex !== -1) {
          demoDealsByStage[oldStage][stageIndex] = demoDeals[index];
        }
      }
      res.json(demoDeals[index]);
      return;
    }

    const { Deal, Company, Contact, PipelineStage } = await import('../models');
    const { logDealActivity } = await import('../services/activityService');

    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    const previousData = deal.toJSON();
    await deal.update(req.body);

    await logDealActivity(
      deal.id,
      'updated',
      req.user?.id,
      `Deal "${deal.name}" was updated`,
      { previousData, newData: req.body }
    );

    const fullDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
    });

    // Emit socket event for real-time updates
    try {
      const { getIO } = await import('../socket');
      const io = getIO();
      io.emit('deal:updated', fullDeal);
    } catch (e) {
      // Socket not initialized yet
    }

    res.json(fullDeal);
  } catch (error) {
    next(error);
  }
};

export const updateDealStage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoDeals.findIndex(d => d.id === req.params.id);
      if (index === -1) {
        throw new AppError('Deal not found', 404);
      }
      const previousStageId = demoDeals[index].stageId;
      demoDeals[index] = {
        ...demoDeals[index],
        stageId: req.body.stageId,
        updatedAt: new Date().toISOString()
      };
      // Update demoDealsByStage - remove from old stage and add to new stage
      demoDealsByStage[previousStage] = demoDealsByStage[previousStage].filter(d => d.id !== req.params.id);
      if (demoDealsByStage[req.body.stage]) {
        demoDealsByStage[req.body.stage].unshift(demoDeals[index]);
      }
      res.json(demoDeals[index]);
      return;
    }

    const { Deal, Company, Contact, PipelineStage } = await import('../models');
    const { logDealActivity } = await import('../services/activityService');

    const deal = await Deal.findByPk(req.params.id, {
      include: [{ model: PipelineStage, as: 'stage' }],
    });

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    const previousStageId = deal.stageId;
    await deal.update({ stageId: req.body.stageId });

    await logDealActivity(
      deal.id,
      'stage_changed',
      req.user?.id,
      `Deal "${deal.name}" stage changed`,
      { previousStageId, newStageId: req.body.stageId }
    );

    const fullDeal = await Deal.findByPk(deal.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
    });

    // Emit socket event for real-time updates
    try {
      const { getIO } = await import('../socket');
      const io = getIO();
      io.emit('deal:stageChanged', { deal: fullDeal, previousStageId, newStageId: req.body.stageId });
    } catch (e) {
      // Socket not initialized yet
    }

    res.json(fullDeal);
  } catch (error) {
    next(error);
  }
};

export const deleteDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoDeals.findIndex(d => d.id === req.params.id);
      if (index === -1) {
        throw new AppError('Deal not found', 404);
      }
      const dealStage = demoDeals[index].stage;
      demoDeals.splice(index, 1);
      // Remove from demoDealsByStage as well
      if (demoDealsByStage[dealStage]) {
        demoDealsByStage[dealStage] = demoDealsByStage[dealStage].filter(d => d.id !== req.params.id);
      }
      res.status(204).send();
      return;
    }

    const { Deal } = await import('../models');

    const deal = await Deal.findByPk(req.params.id);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    const dealId = deal.id;
    await deal.destroy();

    // Emit socket event for real-time updates
    try {
      const { getIO } = await import('../socket');
      const io = getIO();
      io.emit('deal:deleted', { id: dealId });
    } catch (e) {
      // Socket not initialized yet
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
