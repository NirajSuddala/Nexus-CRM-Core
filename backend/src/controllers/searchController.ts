import { Request, Response, NextFunction } from 'express';
import { Company, Contact, Deal, Task } from '../models';
import { Op } from 'sequelize';

export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query.q as string;
    const type = (req.query.type as string) || 'all';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.length < 2) {
      res.json({ companies: [], contacts: [], deals: [], tasks: [] });
      return;
    }

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
