import { Request, Response, NextFunction } from 'express';
import { isDatabaseConnected } from '../config/database';
import { demoCompanies, demoContacts, demoDeals, demoTasks } from '../services/demoData';

export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    const type = (req.query.type as string) || 'all';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      res.json({ companies: [], contacts: [], deals: [], tasks: [] });
      return;
    }

    // Demo mode search
    if (!isDatabaseConnected) {
      const results: Record<string, any[]> = {};

      // Search Companies
      if (type === 'all' || type === 'companies') {
        results.companies = demoCompanies
          .filter((c) =>
            c.name.toLowerCase().includes(query) ||
            c.domain?.toLowerCase().includes(query) ||
            c.industry?.toLowerCase().includes(query)
          )
          .slice(0, limit);
      }

      // Search Contacts
      if (type === 'all' || type === 'contacts') {
        results.contacts = demoContacts
          .filter((c) =>
            c.fullName.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query) ||
            c.jobTitle?.toLowerCase().includes(query)
          )
          .slice(0, limit);
      }

      // Search Deals
      if (type === 'all' || type === 'deals') {
        results.deals = demoDeals
          .filter((d) => d.name.toLowerCase().includes(query))
          .slice(0, limit);
      }

      // Search Tasks
      if (type === 'all' || type === 'tasks') {
        results.tasks = demoTasks
          .filter((t) =>
            t.name.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
          )
          .slice(0, limit);
      }

      res.json(results);
      return;
    }

    // Database mode search
    const { Company, Contact, Deal, Task } = await import('../models');
    const { Op } = await import('sequelize');
    const searchPattern = { [Op.iLike]: `%${query}%` };
    const results: Record<string, any[]> = {};

    // Search Companies
    if (type === 'all' || type === 'companies') {
      const companies = await Company.findAll({
        where: {
          [Op.or]: [
            { name: searchPattern },
            { domain: searchPattern },
            { industry: searchPattern },
          ],
        },
        limit,
        order: [['name', 'ASC']],
      });
      results.companies = companies;
    }

    // Search Contacts
    if (type === 'all' || type === 'contacts') {
      const contacts = await Contact.findAll({
        where: {
          [Op.or]: [
            { fullName: searchPattern },
            { email: searchPattern },
            { jobTitle: searchPattern },
          ],
        },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
        ],
        limit,
        order: [['fullName', 'ASC']],
      });
      results.contacts = contacts;
    }

    // Search Deals
    if (type === 'all' || type === 'deals') {
      const deals = await Deal.findAll({
        where: {
          name: searchPattern,
        },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: Contact, as: 'contact', attributes: ['id', 'fullName'] },
        ],
        limit,
        order: [['name', 'ASC']],
      });
      results.deals = deals;
    }

    // Search Tasks
    if (type === 'all' || type === 'tasks') {
      const tasks = await Task.findAll({
        where: {
          [Op.or]: [
            { name: searchPattern },
            { description: searchPattern },
          ],
        },
        include: [
          { model: Contact, as: 'contact', attributes: ['id', 'fullName'] },
          { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        ],
        limit,
        order: [['name', 'ASC']],
      });
      results.tasks = tasks;
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};
