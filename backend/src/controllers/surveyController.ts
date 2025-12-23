import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoSurveys, demoSurveyResponses, demoContacts, demoCompanies } from '../services/demoData';

export const getSurveys = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoSurveys];
      if (type) filtered = filtered.filter(s => s.type === type);
      if (status) filtered = filtered.filter(s => s.status === status);

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      res.json({
        surveys: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Survey, User } = await import('../models');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const { rows: surveys, count } = await Survey.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      surveys,
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

export const getSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const survey = demoSurveys.find(s => s.id === req.params.id);
      if (!survey) {
        throw new AppError('Survey not found', 404);
      }
      const responses = demoSurveyResponses.filter(r => r.surveyId === survey.id);
      res.json({ ...survey, responses });
      return;
    }

    const { Survey, User, SurveyResponse, Contact, Company } = await import('../models');

    const survey = await Survey.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator' },
        {
          model: SurveyResponse,
          as: 'responses',
          include: [
            { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
            { model: Company, as: 'company', attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    if (!survey) {
      throw new AppError('Survey not found', 404);
    }

    res.json(survey);
  } catch (error) {
    next(error);
  }
};

export const createSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newSurvey = {
        id: `demo-survey-${Date.now()}`,
        ...req.body,
        status: req.body.status || 'draft',
        createdBy: 'demo-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoSurveys.push(newSurvey as any);
      res.status(201).json(newSurvey);
      return;
    }

    const { Survey, User } = await import('../models');

    const survey = await Survey.create({
      ...req.body,
      createdBy: req.user?.id || 'system',
    });

    const fullSurvey = await Survey.findByPk(survey.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullSurvey);
  } catch (error) {
    next(error);
  }
};

export const updateSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoSurveys.findIndex(s => s.id === req.params.id);
      if (index === -1) {
        throw new AppError('Survey not found', 404);
      }
      demoSurveys[index] = {
        ...demoSurveys[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoSurveys[index]);
      return;
    }

    const { Survey, User } = await import('../models');

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      throw new AppError('Survey not found', 404);
    }

    await survey.update(req.body);

    const fullSurvey = await Survey.findByPk(survey.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullSurvey);
  } catch (error) {
    next(error);
  }
};

export const deleteSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoSurveys.findIndex(s => s.id === req.params.id);
      if (index === -1) {
        throw new AppError('Survey not found', 404);
      }
      demoSurveys.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Survey } = await import('../models');

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      throw new AppError('Survey not found', 404);
    }

    await survey.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Survey Responses
export const getSurveyResponses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const surveyId = req.params.surveyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!isDatabaseConnected) {
      const responses = demoSurveyResponses.filter(r => r.surveyId === surveyId);
      const start = (page - 1) * limit;
      const paged = responses.slice(start, start + limit);

      res.json({
        responses: paged,
        pagination: {
          page,
          limit,
          total: responses.length,
          pages: Math.ceil(responses.length / limit),
        },
      });
      return;
    }

    const { SurveyResponse, Contact, Company } = await import('../models');
    const offset = (page - 1) * limit;

    const { rows: responses, count } = await SurveyResponse.findAndCountAll({
      where: { surveyId },
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
      order: [['submittedAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      responses,
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

export const createSurveyResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const surveyId = req.params.surveyId;

    if (!isDatabaseConnected) {
      const newResponse = {
        id: `demo-response-${Date.now()}`,
        surveyId,
        ...req.body,
        submittedAt: new Date().toISOString(),
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : null,
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoSurveyResponses.push(newResponse as any);
      res.status(201).json(newResponse);
      return;
    }

    const { SurveyResponse, Contact, Company } = await import('../models');

    const response = await SurveyResponse.create({
      ...req.body,
      surveyId,
      submittedAt: new Date(),
    });

    const fullResponse = await SurveyResponse.findByPk(response.id, {
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(fullResponse);
  } catch (error) {
    next(error);
  }
};

export const getSurveyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const surveyId = req.params.surveyId;

    if (!isDatabaseConnected) {
      const responses = demoSurveyResponses.filter(r => r.surveyId === surveyId);
      const scores = responses.map(r => r.score).filter(s => s !== null && s !== undefined);

      const stats = {
        totalResponses: responses.length,
        averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        npsScore: scores.length > 0 ? calculateNPS(scores) : null,
        scoreDistribution: calculateScoreDistribution(scores),
      };

      res.json(stats);
      return;
    }

    const { SurveyResponse } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const [countResult, avgResult, responses] = await Promise.all([
      SurveyResponse.count({ where: { surveyId } }),
      SurveyResponse.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
        where: { surveyId },
        raw: true,
      }) as Promise<any>,
      SurveyResponse.findAll({
        attributes: ['score'],
        where: { surveyId },
        raw: true,
      }),
    ]);

    const scores = responses.map((r: any) => r.score).filter((s: any) => s !== null);

    res.json({
      totalResponses: countResult,
      averageScore: avgResult?.avgScore || 0,
      npsScore: scores.length > 0 ? calculateNPS(scores) : null,
      scoreDistribution: calculateScoreDistribution(scores),
    });
  } catch (error) {
    next(error);
  }
};

function calculateNPS(scores: number[]): number {
  const promoters = scores.filter(s => s >= 9).length;
  const detractors = scores.filter(s => s <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

function calculateScoreDistribution(scores: number[]): Record<number, number> {
  const distribution: Record<number, number> = {};
  for (let i = 0; i <= 10; i++) {
    distribution[i] = scores.filter(s => s === i).length;
  }
  return distribution;
}
