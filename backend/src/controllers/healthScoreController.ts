import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoHealthScores, demoCompanies, demoContacts, demoSurveys, demoSurveyResponses } from '../services/demoData';
import type { RiskLevel } from '../models/HealthScore';

// Helper function to calculate survey scores for a company from demo data
const calculateSurveyScoresForCompany = (companyId: string) => {
  // Get all survey responses for this company
  const companyResponses = demoSurveyResponses.filter(r => r.companyId === companyId);

  // Calculate NPS score (from NPS type surveys)
  const npsSurveyIds = demoSurveys.filter(s => s.type.toUpperCase() === 'NPS').map(s => s.id);
  const npsResponses = companyResponses.filter(r => npsSurveyIds.includes(r.surveyId));
  let npsScore: number | null = null;
  if (npsResponses.length > 0) {
    const promoters = npsResponses.filter(r => r.score >= 9).length;
    const detractors = npsResponses.filter(r => r.score <= 6).length;
    npsScore = Math.round(((promoters - detractors) / npsResponses.length) * 100);
  }

  // Calculate CSAT score (from CSAT type surveys) - average score normalized to 0-100
  const csatSurveyIds = demoSurveys.filter(s => s.type.toUpperCase() === 'CSAT').map(s => s.id);
  const csatResponses = companyResponses.filter(r => csatSurveyIds.includes(r.surveyId));
  let csatScore: number | null = null;
  if (csatResponses.length > 0) {
    const avgScore = csatResponses.reduce((sum, r) => sum + (r.score || 0), 0) / csatResponses.length;
    csatScore = Math.round((avgScore / 5) * 100); // Assuming 5-point scale
  }

  // Calculate CES score (from CES type surveys) - average score normalized to 0-100
  const cesSurveyIds = demoSurveys.filter(s => s.type.toUpperCase() === 'CES').map(s => s.id);
  const cesResponses = companyResponses.filter(r => cesSurveyIds.includes(r.surveyId));
  let cesScore: number | null = null;
  if (cesResponses.length > 0) {
    const avgScore = cesResponses.reduce((sum, r) => sum + (r.score || 0), 0) / cesResponses.length;
    cesScore = Math.round((avgScore / 7) * 100); // Assuming 7-point scale for CES
  }

  return { npsScore, csatScore, cesScore };
};

export const getHealthScores = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const riskLevel = req.query.riskLevel as string;
    const companyId = req.query.companyId as string;
    const contactId = req.query.contactId as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoHealthScores];
      if (riskLevel) filtered = filtered.filter(h => h.riskLevel === riskLevel);
      if (companyId) filtered = filtered.filter(h => h.companyId === companyId);
      if (contactId) filtered = filtered.filter(h => h.contactId === contactId);

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      // Enrich health scores with calculated survey scores
      const enrichedHealthScores = paged.map(hs => {
        const surveyScores = calculateSurveyScoresForCompany(hs.companyId);
        return {
          ...hs,
          npsScore: surveyScores.npsScore ?? hs.npsScore,
          csatScore: surveyScores.csatScore ?? hs.csatScore,
          cesScore: surveyScores.cesScore,
        };
      });

      res.json({
        healthScores: enrichedHealthScores,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { HealthScore, Company, Contact } = await import('../models');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;

    const { rows: healthScores, count } = await HealthScore.findAndCountAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [
        ['score', 'ASC'],
        ['calculatedAt', 'DESC'],
      ],
      limit,
      offset,
    });

    res.json({
      healthScores,
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

export const getHealthScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const healthScore = demoHealthScores.find(h => h.id === req.params.id);
      if (!healthScore) {
        throw new AppError('Health score not found', 404);
      }
      res.json(healthScore);
      return;
    }

    const { HealthScore, Company, Contact } = await import('../models');

    const healthScore = await HealthScore.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'company' },
        { model: Contact, as: 'contact' },
      ],
    });

    if (!healthScore) {
      throw new AppError('Health score not found', 404);
    }

    res.json(healthScore);
  } catch (error) {
    next(error);
  }
};

export const getCompanyHealthScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companyId = req.params.companyId;

    if (!isDatabaseConnected) {
      const healthScore = demoHealthScores.find(h => h.companyId === companyId);
      if (!healthScore) {
        // Return a default health score
        res.json({
          companyId,
          score: 75,
          riskLevel: 'good',
          factors: {},
          calculatedAt: new Date().toISOString(),
        });
        return;
      }
      res.json(healthScore);
      return;
    }

    const { HealthScore, Company, Contact } = await import('../models');

    const healthScore = await HealthScore.findOne({
      where: { companyId },
      include: [
        { model: Company, as: 'company' },
        { model: Contact, as: 'contact' },
      ],
      order: [['calculatedAt', 'DESC']],
    });

    if (!healthScore) {
      res.json({
        companyId,
        score: 75,
        riskLevel: 'good',
        factors: {},
        calculatedAt: new Date().toISOString(),
      });
      return;
    }

    res.json(healthScore);
  } catch (error) {
    next(error);
  }
};

export const createHealthScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const score = req.body.score || 75;
      const riskLevel = calculateRiskLevel(score);

      const newHealthScore = {
        id: `demo-health-${Date.now()}`,
        ...req.body,
        score,
        riskLevel,
        calculatedAt: new Date().toISOString(),
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : null,
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoHealthScores.push(newHealthScore as any);
      res.status(201).json(newHealthScore);
      return;
    }

    const { HealthScore, Company, Contact } = await import('../models');

    const score = req.body.score || 75;
    const riskLevel = calculateRiskLevel(score);

    const healthScore = await HealthScore.create({
      ...req.body,
      score,
      riskLevel,
      calculatedAt: new Date(),
    });

    const fullHealthScore = await HealthScore.findByPk(healthScore.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullHealthScore);
  } catch (error) {
    next(error);
  }
};

export const updateHealthScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoHealthScores.findIndex(h => h.id === req.params.id);
      if (index === -1) {
        throw new AppError('Health score not found', 404);
      }

      const score = req.body.score || demoHealthScores[index].score;
      const riskLevel = calculateRiskLevel(score);

      demoHealthScores[index] = {
        ...demoHealthScores[index],
        ...req.body,
        score,
        riskLevel,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoHealthScores[index]);
      return;
    }

    const { HealthScore, Company, Contact } = await import('../models');

    const healthScore = await HealthScore.findByPk(req.params.id);
    if (!healthScore) {
      throw new AppError('Health score not found', 404);
    }

    const score = req.body.score || healthScore.score;
    const riskLevel = calculateRiskLevel(score);

    await healthScore.update({
      ...req.body,
      score,
      riskLevel,
    });

    const fullHealthScore = await HealthScore.findByPk(healthScore.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullHealthScore);
  } catch (error) {
    next(error);
  }
};

export const recalculateHealthScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companyId = req.params.companyId;

    if (!isDatabaseConnected) {
      // Simple recalculation for demo mode
      const existingIndex = demoHealthScores.findIndex(h => h.companyId === companyId);
      const newScore = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
      const riskLevel = calculateRiskLevel(newScore);

      const healthScore = {
        id: existingIndex >= 0 ? demoHealthScores[existingIndex].id : `demo-health-${Date.now()}`,
        companyId,
        contactId: null,
        score: newScore,
        riskLevel,
        factors: {
          engagement: Math.floor(Math.random() * 100),
          satisfaction: Math.floor(Math.random() * 100),
          usage: Math.floor(Math.random() * 100),
          support: Math.floor(Math.random() * 100),
        },
        calculatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        demoHealthScores[existingIndex] = healthScore as any;
      } else {
        demoHealthScores.push(healthScore as any);
      }

      res.json(healthScore);
      return;
    }

    const { HealthScore, Company, Contact, Activity, SurveyResponse, Ticket } = await import('../models');
    const { Op } = await import('sequelize');

    // Calculate health score based on various factors
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activityCount, surveyResponses, openTickets] = await Promise.all([
      Activity.count({
        where: {
          companyId,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      }),
      SurveyResponse.findAll({
        where: {
          companyId,
          submittedAt: { [Op.gte]: thirtyDaysAgo },
        },
        attributes: ['score'],
        raw: true,
      }),
      Ticket.count({
        where: {
          companyId,
          status: { [Op.in]: ['open', 'in_progress'] },
        },
      }),
    ]);

    // Calculate factors
    const engagementScore = Math.min(100, activityCount * 10);
    const avgSurveyScore = surveyResponses.length > 0
      ? surveyResponses.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / surveyResponses.length
      : 70;
    const satisfactionScore = (avgSurveyScore / 10) * 100;
    const supportScore = Math.max(0, 100 - openTickets * 20);

    // Calculate overall score
    const overallScore = Math.round(
      engagementScore * 0.3 +
      satisfactionScore * 0.4 +
      supportScore * 0.3
    );

    const riskLevel = calculateRiskLevel(overallScore);

    // Create or update health score
    const [healthScore] = await HealthScore.upsert({
      companyId,
      score: overallScore,
      riskLevel,
      engagementScore,
      csatScore: satisfactionScore,
      calculatedAt: new Date(),
    });

    const fullHealthScore = await HealthScore.findByPk(healthScore.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullHealthScore);
  } catch (error) {
    next(error);
  }
};

export const getHealthScoreStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const stats = {
        byRiskLevel: {
          at_risk: demoHealthScores.filter(h => h.riskLevel === 'at_risk').length,
          caution: demoHealthScores.filter(h => h.riskLevel === 'caution').length,
          good: demoHealthScores.filter(h => h.riskLevel === 'good').length,
          excellent: demoHealthScores.filter(h => h.riskLevel === 'excellent').length,
        },
        averageScore: demoHealthScores.length > 0
          ? Math.round(demoHealthScores.reduce((sum, h) => sum + h.score, 0) / demoHealthScores.length)
          : 0,
        total: demoHealthScores.length,
      };
      res.json(stats);
      return;
    }

    const { HealthScore } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const [riskStats, avgResult, total] = await Promise.all([
      HealthScore.findAll({
        attributes: ['riskLevel', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['riskLevel'],
        raw: true,
      }),
      HealthScore.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
        raw: true,
      }) as Promise<any>,
      HealthScore.count(),
    ]);

    res.json({
      byRiskLevel: riskStats,
      averageScore: Math.round(avgResult?.avgScore || 0),
      total,
    });
  } catch (error) {
    next(error);
  }
};

function calculateRiskLevel(score: number): RiskLevel {
  if (score < 40) return 'at_risk';
  if (score < 60) return 'caution';
  if (score < 80) return 'good';
  return 'excellent';
}
