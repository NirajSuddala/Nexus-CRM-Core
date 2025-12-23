import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoPipelines, demoPipelineStages } from '../services/demoData';

export const getPipelines = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!isDatabaseConnected) {
      let filtered = [...demoPipelines];
      if (type) {
        filtered = filtered.filter(p => p.type === type);
      }
      const total = filtered.length;
      const paginatedPipelines = filtered.slice((page - 1) * limit, page * limit);
      res.json({
        pipelines: paginatedPipelines,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
      return;
    }

    const { Pipeline, PipelineStage } = await import('../models');

    const where: any = {};
    if (type) where.type = type;

    const { count, rows: pipelines } = await Pipeline.findAndCountAll({
      where,
      include: [{ model: PipelineStage, as: 'stages' }],
      order: [['name', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      pipelines,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getPipeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const pipeline = demoPipelines.find(p => p.id === req.params.id);
      if (!pipeline) {
        throw new AppError('Pipeline not found', 404);
      }
      const stages = demoPipelineStages.filter(s => s.pipelineId === pipeline.id);
      res.json({ ...pipeline, stages });
      return;
    }

    const { Pipeline, PipelineStage } = await import('../models');

    const pipeline = await Pipeline.findByPk(req.params.id, {
      include: [{ model: PipelineStage, as: 'stages', order: [['sortOrder', 'ASC']] }],
    });

    if (!pipeline) {
      throw new AppError('Pipeline not found', 404);
    }

    res.json(pipeline);
  } catch (error) {
    next(error);
  }
};

export const createPipeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newPipeline = {
        id: `demo-pipeline-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoPipelines.push(newPipeline as any);
      res.status(201).json(newPipeline);
      return;
    }

    const { Pipeline } = await import('../models');

    const pipeline = await Pipeline.create(req.body);
    res.status(201).json(pipeline);
  } catch (error) {
    next(error);
  }
};

export const updatePipeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoPipelines.findIndex(p => p.id === req.params.id);
      if (index === -1) {
        throw new AppError('Pipeline not found', 404);
      }
      demoPipelines[index] = {
        ...demoPipelines[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoPipelines[index]);
      return;
    }

    const { Pipeline } = await import('../models');

    const pipeline = await Pipeline.findByPk(req.params.id);
    if (!pipeline) {
      throw new AppError('Pipeline not found', 404);
    }

    await pipeline.update(req.body);
    res.json(pipeline);
  } catch (error) {
    next(error);
  }
};

export const deletePipeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoPipelines.findIndex(p => p.id === req.params.id);
      if (index === -1) {
        throw new AppError('Pipeline not found', 404);
      }
      demoPipelines.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Pipeline } = await import('../models');

    const pipeline = await Pipeline.findByPk(req.params.id);
    if (!pipeline) {
      throw new AppError('Pipeline not found', 404);
    }

    await pipeline.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Pipeline Stages
export const getStages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pipelineId = req.params.pipelineId;

    if (!isDatabaseConnected) {
      const stages = demoPipelineStages.filter(s => s.pipelineId === pipelineId);
      res.json(stages);
      return;
    }

    const { PipelineStage } = await import('../models');

    const stages = await PipelineStage.findAll({
      where: { pipelineId },
      order: [['sortOrder', 'ASC']],
    });

    res.json(stages);
  } catch (error) {
    next(error);
  }
};

export const createStage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pipelineId = req.params.pipelineId;

    if (!isDatabaseConnected) {
      const newStage = {
        id: `demo-stage-${Date.now()}`,
        pipelineId,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoPipelineStages.push(newStage as any);
      res.status(201).json(newStage);
      return;
    }

    const { PipelineStage } = await import('../models');

    const stage = await PipelineStage.create({ ...req.body, pipelineId });
    res.status(201).json(stage);
  } catch (error) {
    next(error);
  }
};

export const updateStage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoPipelineStages.findIndex(s => s.id === req.params.stageId);
      if (index === -1) {
        throw new AppError('Stage not found', 404);
      }
      demoPipelineStages[index] = {
        ...demoPipelineStages[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoPipelineStages[index]);
      return;
    }

    const { PipelineStage } = await import('../models');

    const stage = await PipelineStage.findByPk(req.params.stageId);
    if (!stage) {
      throw new AppError('Stage not found', 404);
    }

    await stage.update(req.body);
    res.json(stage);
  } catch (error) {
    next(error);
  }
};

export const deleteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoPipelineStages.findIndex(s => s.id === req.params.stageId);
      if (index === -1) {
        throw new AppError('Stage not found', 404);
      }
      demoPipelineStages.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { PipelineStage } = await import('../models');

    const stage = await PipelineStage.findByPk(req.params.stageId);
    if (!stage) {
      throw new AppError('Stage not found', 404);
    }

    await stage.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
