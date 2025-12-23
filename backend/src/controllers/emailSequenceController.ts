import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoEmailSequences, demoEmailSequenceSteps, demoEmailTemplates } from '../services/demoData';

export const getEmailSequences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const trigger = req.query.trigger as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoEmailSequences];
      if (status) filtered = filtered.filter(s => s.status === status);
      if (trigger) filtered = filtered.filter(s => s.trigger === trigger);

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      res.json({
        sequences: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { EmailSequence, User, EmailSequenceStep } = await import('../models');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (trigger) where.trigger = trigger;

    const { rows: sequences, count } = await EmailSequence.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        { model: EmailSequenceStep, as: 'steps' },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      sequences,
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

export const getEmailSequence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const sequence = demoEmailSequences.find(s => s.id === req.params.id);
      if (!sequence) {
        throw new AppError('Email sequence not found', 404);
      }
      const steps = demoEmailSequenceSteps.filter(s => s.sequenceId === sequence.id);
      res.json({ ...sequence, steps });
      return;
    }

    const { EmailSequence, User, EmailSequenceStep, EmailTemplate } = await import('../models');

    const sequence = await EmailSequence.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator' },
        {
          model: EmailSequenceStep,
          as: 'steps',
          include: [{ model: EmailTemplate, as: 'template' }],
          order: [['sortOrder', 'ASC']],
        },
      ],
    });

    if (!sequence) {
      throw new AppError('Email sequence not found', 404);
    }

    res.json(sequence);
  } catch (error) {
    next(error);
  }
};

export const createEmailSequence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newSequence = {
        id: `demo-sequence-${Date.now()}`,
        ...req.body,
        status: req.body.status || 'draft',
        createdBy: 'demo-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoEmailSequences.push(newSequence as any);
      res.status(201).json(newSequence);
      return;
    }

    const { EmailSequence, User } = await import('../models');

    const sequence = await EmailSequence.create({
      ...req.body,
      createdBy: req.user?.id || 'system',
    });

    const fullSequence = await EmailSequence.findByPk(sequence.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullSequence);
  } catch (error) {
    next(error);
  }
};

export const updateEmailSequence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoEmailSequences.findIndex(s => s.id === req.params.id);
      if (index === -1) {
        throw new AppError('Email sequence not found', 404);
      }
      demoEmailSequences[index] = {
        ...demoEmailSequences[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoEmailSequences[index]);
      return;
    }

    const { EmailSequence, User, EmailSequenceStep } = await import('../models');

    const sequence = await EmailSequence.findByPk(req.params.id);
    if (!sequence) {
      throw new AppError('Email sequence not found', 404);
    }

    await sequence.update(req.body);

    const fullSequence = await EmailSequence.findByPk(sequence.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        { model: EmailSequenceStep, as: 'steps' },
      ],
    });

    res.json(fullSequence);
  } catch (error) {
    next(error);
  }
};

export const deleteEmailSequence = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoEmailSequences.findIndex(s => s.id === req.params.id);
      if (index === -1) {
        throw new AppError('Email sequence not found', 404);
      }
      demoEmailSequences.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { EmailSequence } = await import('../models');

    const sequence = await EmailSequence.findByPk(req.params.id);
    if (!sequence) {
      throw new AppError('Email sequence not found', 404);
    }

    await sequence.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Sequence Steps
export const getSequenceSteps = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sequenceId = req.params.sequenceId;

    if (!isDatabaseConnected) {
      const steps = demoEmailSequenceSteps.filter(s => s.sequenceId === sequenceId);
      res.json(steps);
      return;
    }

    const { EmailSequenceStep, EmailTemplate } = await import('../models');

    const steps = await EmailSequenceStep.findAll({
      where: { sequenceId },
      include: [{ model: EmailTemplate, as: 'template' }],
      order: [['sortOrder', 'ASC']],
    });

    res.json(steps);
  } catch (error) {
    next(error);
  }
};

export const createSequenceStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sequenceId = req.params.sequenceId;

    if (!isDatabaseConnected) {
      const existingSteps = demoEmailSequenceSteps.filter(s => s.sequenceId === sequenceId);
      const newStep = {
        id: `demo-step-${Date.now()}`,
        sequenceId,
        ...req.body,
        sortOrder: req.body.sortOrder ?? existingSteps.length,
        template: req.body.templateId ? demoEmailTemplates.find(t => t.id === req.body.templateId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoEmailSequenceSteps.push(newStep as any);
      res.status(201).json(newStep);
      return;
    }

    const { EmailSequenceStep, EmailTemplate } = await import('../models');

    const step = await EmailSequenceStep.create({ ...req.body, sequenceId });

    const fullStep = await EmailSequenceStep.findByPk(step.id, {
      include: [{ model: EmailTemplate, as: 'template' }],
    });

    res.status(201).json(fullStep);
  } catch (error) {
    next(error);
  }
};

export const updateSequenceStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoEmailSequenceSteps.findIndex(s => s.id === req.params.stepId);
      if (index === -1) {
        throw new AppError('Sequence step not found', 404);
      }
      demoEmailSequenceSteps[index] = {
        ...demoEmailSequenceSteps[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoEmailSequenceSteps[index]);
      return;
    }

    const { EmailSequenceStep, EmailTemplate } = await import('../models');

    const step = await EmailSequenceStep.findByPk(req.params.stepId);
    if (!step) {
      throw new AppError('Sequence step not found', 404);
    }

    await step.update(req.body);

    const fullStep = await EmailSequenceStep.findByPk(step.id, {
      include: [{ model: EmailTemplate, as: 'template' }],
    });

    res.json(fullStep);
  } catch (error) {
    next(error);
  }
};

export const deleteSequenceStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoEmailSequenceSteps.findIndex(s => s.id === req.params.stepId);
      if (index === -1) {
        throw new AppError('Sequence step not found', 404);
      }
      demoEmailSequenceSteps.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { EmailSequenceStep } = await import('../models');

    const step = await EmailSequenceStep.findByPk(req.params.stepId);
    if (!step) {
      throw new AppError('Sequence step not found', 404);
    }

    await step.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Email Templates
export const getEmailTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!isDatabaseConnected) {
      const start = (page - 1) * limit;
      const paged = demoEmailTemplates.slice(start, start + limit);

      res.json({
        templates: paged,
        pagination: {
          page,
          limit,
          total: demoEmailTemplates.length,
          pages: Math.ceil(demoEmailTemplates.length / limit),
        },
      });
      return;
    }

    const { EmailTemplate, User } = await import('../models');
    const offset = (page - 1) * limit;

    const { rows: templates, count } = await EmailTemplate.findAndCountAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    res.json({
      templates,
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

export const getEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const template = demoEmailTemplates.find(t => t.id === req.params.id);
      if (!template) {
        throw new AppError('Email template not found', 404);
      }
      res.json(template);
      return;
    }

    const { EmailTemplate, User } = await import('../models');

    const template = await EmailTemplate.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator' }],
    });

    if (!template) {
      throw new AppError('Email template not found', 404);
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
};

export const createEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newTemplate = {
        id: `demo-template-${Date.now()}`,
        ...req.body,
        createdBy: 'demo-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoEmailTemplates.push(newTemplate as any);
      res.status(201).json(newTemplate);
      return;
    }

    const { EmailTemplate, User } = await import('../models');

    const template = await EmailTemplate.create({
      ...req.body,
      createdBy: req.user?.id || 'system',
    });

    const fullTemplate = await EmailTemplate.findByPk(template.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }],
    });

    res.status(201).json(fullTemplate);
  } catch (error) {
    next(error);
  }
};

export const updateEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoEmailTemplates.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new AppError('Email template not found', 404);
      }
      demoEmailTemplates[index] = {
        ...demoEmailTemplates[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoEmailTemplates[index]);
      return;
    }

    const { EmailTemplate, User } = await import('../models');

    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) {
      throw new AppError('Email template not found', 404);
    }

    await template.update(req.body);

    const fullTemplate = await EmailTemplate.findByPk(template.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }],
    });

    res.json(fullTemplate);
  } catch (error) {
    next(error);
  }
};

export const deleteEmailTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoEmailTemplates.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new AppError('Email template not found', 404);
      }
      demoEmailTemplates.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { EmailTemplate } = await import('../models');

    const template = await EmailTemplate.findByPk(req.params.id);
    if (!template) {
      throw new AppError('Email template not found', 404);
    }

    await template.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
