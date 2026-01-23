import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoCompanies, demoContacts, demoDeals, demoActivities } from '../services/demoData';

export const getCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string || '').toLowerCase();

    if (!isDatabaseConnected) {
      let filtered = demoCompanies;
      if (search) {
        filtered = demoCompanies.filter(c =>
          c.name.toLowerCase().includes(search) ||
          (c.website && c.website.toLowerCase().includes(search)) ||
          (c.industry && c.industry.toLowerCase().includes(search))
        );
      }

      // Add contacts and deals count
      const companiesWithRelations = filtered.map(company => ({
        ...company,
        contacts: demoContacts.filter(c => c.companyId === company.id).map(c => ({ id: c.id })),
        deals: demoDeals.filter(d => d.companyId === company.id).map(d => ({ id: d.id, amount: d.amount, stageId: d.stageId })),
      }));

      res.json({
        companies: companiesWithRelations,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Company, Contact, Deal } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { website: { [Op.iLike]: `%${search}%` } },
        { industry: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: companies, count } = await Company.findAndCountAll({
      where,
      include: [
        { model: Contact, as: 'contacts', attributes: ['id'] },
        { model: Deal, as: 'deals', attributes: ['id', 'amount', 'stageId'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      companies,
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

export const getCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const company = demoCompanies.find(c => c.id === req.params.id);
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // Add fullName to contacts for frontend compatibility
      const contactsWithFullName = demoContacts
        .filter(c => c.companyId === company.id)
        .map(c => ({
          ...c,
          fullName: c.fullName || `${c.firstName} ${c.lastName}`,
          jobTitle: c.jobTitle || c.title,
        }));

      // Add stage property to deals for frontend compatibility
      const dealsWithStage = demoDeals
        .filter(d => d.companyId === company.id)
        .map(d => ({
          ...d,
          stage: d.stageName?.toLowerCase().replace(' ', '_') || 'discovery',
        }));

      const companyWithRelations = {
        ...company,
        contacts: contactsWithFullName,
        deals: dealsWithStage,
      };

      const activities = demoActivities.filter(a => a.companyId === company.id);

      res.json({ company: companyWithRelations, activities });
      return;
    }

    const { Company, Contact, Deal, Activity } = await import('../models');

    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: Contact, as: 'contacts' },
        { model: Deal, as: 'deals' },
      ],
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const activities = await Activity.findAll({
      where: { companyId: company.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.json({ company, activities });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newCompany = {
        id: `demo-company-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoCompanies.push(newCompany);
      res.status(201).json(newCompany);
      return;
    }

    const { Company } = await import('../models');
    const { logCompanyActivity } = await import('../services/activityService');

    const company = await Company.create(req.body);

    await logCompanyActivity(
      company.id,
      'created',
      req.user?.id,
      `Company "${company.name}" was created`
    );

    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoCompanies.findIndex(c => c.id === req.params.id);
      if (index === -1) {
        throw new AppError('Company not found', 404);
      }
      demoCompanies[index] = { ...demoCompanies[index], ...req.body, updatedAt: new Date().toISOString() };
      res.json(demoCompanies[index]);
      return;
    }

    const { Company } = await import('../models');
    const { logCompanyActivity } = await import('../services/activityService');

    const company = await Company.findByPk(req.params.id);

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const previousData = company.toJSON();
    await company.update(req.body);

    await logCompanyActivity(
      company.id,
      'updated',
      req.user?.id,
      `Company "${company.name}" was updated`,
      { previousData, newData: req.body }
    );

    res.json(company);
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoCompanies.findIndex(c => c.id === req.params.id);
      if (index === -1) {
        throw new AppError('Company not found', 404);
      }
      demoCompanies.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Company } = await import('../models');

    const company = await Company.findByPk(req.params.id);

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    await company.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
