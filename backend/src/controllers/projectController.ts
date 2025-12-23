import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoProjects, demoMilestones, demoCompanies, demoContacts } from '../services/demoData';

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string || '').toLowerCase();
    const type = req.query.type as string;
    const status = req.query.status as string;
    const companyId = req.query.companyId as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoProjects];
      if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
      }
      if (type) filtered = filtered.filter(p => p.type === type);
      if (status) filtered = filtered.filter(p => p.status === status);
      if (companyId) filtered = filtered.filter(p => p.companyId === companyId);

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      res.json({
        projects: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Project, Company, Contact, Deal, User, PipelineStage, Milestone } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;

    const { rows: projects, count } = await Project.findAndCountAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
        { model: Milestone, as: 'milestones' },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      projects,
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

export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const project = demoProjects.find(p => p.id === req.params.id);
      if (!project) {
        throw new AppError('Project not found', 404);
      }
      const milestones = demoMilestones.filter(m => m.projectId === project.id);
      res.json({ ...project, milestones });
      return;
    }

    const { Project, Company, Contact, Deal, User, PipelineStage, Milestone, Ticket } = await import('../models');

    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'company' },
        { model: Contact, as: 'contact' },
        { model: Deal, as: 'deal' },
        { model: User, as: 'owner' },
        { model: PipelineStage, as: 'stage' },
        { model: Milestone, as: 'milestones', order: [['sortOrder', 'ASC']] },
        { model: Ticket, as: 'tickets' },
      ],
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newProject = {
        id: `demo-project-${Date.now()}`,
        ...req.body,
        progress: 0,
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : null,
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoProjects.push(newProject as any);
      res.status(201).json(newProject);
      return;
    }

    const { Project, Company, Contact, Deal, User, PipelineStage } = await import('../models');

    const project = await Project.create({
      ...req.body,
      ownerId: req.body.ownerId || req.user?.id,
    });

    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(fullProject);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoProjects.findIndex(p => p.id === req.params.id);
      if (index === -1) {
        throw new AppError('Project not found', 404);
      }
      demoProjects[index] = {
        ...demoProjects[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoProjects[index]);
      return;
    }

    const { Project, Company, Contact, Deal, User, PipelineStage } = await import('../models');

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await project.update(req.body);

    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
      ],
    });

    res.json(fullProject);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoProjects.findIndex(p => p.id === req.params.id);
      if (index === -1) {
        throw new AppError('Project not found', 404);
      }
      demoProjects.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Project } = await import('../models');

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await project.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Milestones
export const getMilestones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.params.projectId;

    if (!isDatabaseConnected) {
      const milestones = demoMilestones.filter(m => m.projectId === projectId);
      res.json(milestones);
      return;
    }

    const { Milestone } = await import('../models');

    const milestones = await Milestone.findAll({
      where: { projectId },
      order: [['sortOrder', 'ASC']],
    });

    res.json(milestones);
  } catch (error) {
    next(error);
  }
};

export const createMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = req.params.projectId;

    if (!isDatabaseConnected) {
      const newMilestone = {
        id: `demo-milestone-${Date.now()}`,
        projectId,
        ...req.body,
        status: req.body.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoMilestones.push(newMilestone as any);
      res.status(201).json(newMilestone);
      return;
    }

    const { Milestone } = await import('../models');

    const milestone = await Milestone.create({ ...req.body, projectId });
    res.status(201).json(milestone);
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoMilestones.findIndex(m => m.id === req.params.milestoneId);
      if (index === -1) {
        throw new AppError('Milestone not found', 404);
      }
      demoMilestones[index] = {
        ...demoMilestones[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoMilestones[index]);
      return;
    }

    const { Milestone } = await import('../models');

    const milestone = await Milestone.findByPk(req.params.milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    await milestone.update(req.body);
    res.json(milestone);
  } catch (error) {
    next(error);
  }
};

export const deleteMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoMilestones.findIndex(m => m.id === req.params.milestoneId);
      if (index === -1) {
        throw new AppError('Milestone not found', 404);
      }
      demoMilestones.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Milestone } = await import('../models');

    const milestone = await Milestone.findByPk(req.params.milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    await milestone.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
