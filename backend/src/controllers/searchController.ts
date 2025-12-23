import { Request, Response, NextFunction } from 'express';
import { Company, Contact, Deal, Task, PipelineStage } from '../models';
import { Op } from 'sequelize';
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
      const queryLower = query.toLowerCase();

      if (type === 'all' || type === 'companies') {
        results.companies = demoCompanies.filter(c =>
          c.name.toLowerCase().includes(queryLower) ||
          (c.website && c.website.toLowerCase().includes(queryLower)) ||
          (c.industry && c.industry.toLowerCase().includes(queryLower))
        ).slice(0, limit);
      }

      if (type === 'all' || type === 'contacts') {
        results.contacts = demoContacts.filter(c =>
          c.firstName.toLowerCase().includes(queryLower) ||
          c.lastName.toLowerCase().includes(queryLower) ||
          c.email.toLowerCase().includes(queryLower) ||
          (c.title && c.title.toLowerCase().includes(queryLower))
        ).slice(0, limit);
      }

      if (type === 'all' || type === 'deals') {
        results.deals = demoDeals.filter(d =>
          d.name.toLowerCase().includes(queryLower)
        ).slice(0, limit);
      }

      if (type === 'all' || type === 'tasks') {
        results.tasks = demoTasks.filter(t =>
          t.title.toLowerCase().includes(queryLower) ||
          (t.description && t.description.toLowerCase().includes(queryLower))
        ).slice(0, limit);
      }

      res.json(results);
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
            { website: searchPattern },
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
            { firstName: searchPattern },
            { lastName: searchPattern },
            { email: searchPattern },
            { title: searchPattern },
          ],
        },
        include: [
          { model: Company, as: 'company', attributes: ['id', 'name'] },
        ],
        limit,
        order: [['firstName', 'ASC']],
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
          { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
          { model: PipelineStage, as: 'stage', attributes: ['id', 'name'] },
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
            { title: searchPattern },
            { description: searchPattern },
          ],
        },
        include: [
          { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
          { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        ],
        limit,
        order: [['title', 'ASC']],
      });
      results.tasks = tasks;
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};
