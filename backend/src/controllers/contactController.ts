import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoContacts, demoCompanies, demoDeals, demoTasks, demoActivities } from '../services/demoData';

export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string || '').toLowerCase();
    const companyId = req.query.companyId as string;
    const lifecycleStage = req.query.lifecycleStage as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoContacts];
      if (search) {
        filtered = filtered.filter(c => {
          const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
          return fullName.includes(search) ||
            (c.email && c.email.toLowerCase().includes(search)) ||
            (c.title && c.title.toLowerCase().includes(search));
        });
      }
      if (companyId) filtered = filtered.filter(c => c.companyId === companyId);
      if (lifecycleStage) filtered = filtered.filter(c => c.lifecycleStage === lifecycleStage);

      const contactsWithCompany = filtered.map(contact => ({
        ...contact,
        fullName: contact.fullName || `${contact.firstName} ${contact.lastName}`,
        jobTitle: contact.jobTitle || contact.title,
        company: contact.companyId ? demoCompanies.find(c => c.id === contact.companyId) : null,
      }));

      res.json({
        contacts: contactsWithCompany,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Contact, Company } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (companyId) where.companyId = companyId;
    if (lifecycleStage) where.lifecycleStage = lifecycleStage;

    const { rows: contacts, count } = await Contact.findAndCountAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      contacts,
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

export const getContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const contact = demoContacts.find(c => c.id === req.params.id);
      if (!contact) {
        throw new AppError('Contact not found', 404);
      }

      // Add tasks with name property for frontend compatibility
      const tasksWithName = demoTasks.filter(t => t.contactId === contact.id).map(t => ({
        ...t,
        name: t.name || t.title,
      }));

      const contactWithRelations = {
        ...contact,
        fullName: contact.fullName || `${contact.firstName} ${contact.lastName}`,
        jobTitle: contact.jobTitle || contact.title,
        company: contact.companyId ? demoCompanies.find(c => c.id === contact.companyId) : null,
        deals: demoDeals.filter(d => d.contactId === contact.id),
        tasks: tasksWithName,
      };

      const activities = demoActivities.filter(a => a.contactId === contact.id);

      res.json({ contact: contactWithRelations, activities });
      return;
    }

    const { Contact, Company, Deal, Task, Activity } = await import('../models');

    const contact = await Contact.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'company' },
        { model: Deal, as: 'deals' },
        { model: Task, as: 'tasks' },
      ],
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const activities = await Activity.findAll({
      where: { contactId: contact.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.json({ contact, activities });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newContact = {
        id: `demo-contact-${Date.now()}`,
        ...req.body,
        lifecycleStage: req.body.lifecycleStage || 'lead',
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoContacts.push(newContact);
      res.status(201).json(newContact);
      return;
    }

    const { Contact, Company } = await import('../models');
    const { logContactActivity } = await import('../services/activityService');

    const contact = await Contact.create(req.body);

    await logContactActivity(
      contact.id,
      'created',
      req.user?.id,
      `Contact "${contact.firstName} ${contact.lastName}" was created`
    );

    const fullContact = await Contact.findByPk(contact.id, {
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    });

    res.status(201).json(fullContact);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoContacts.findIndex(c => c.id === req.params.id);
      if (index === -1) {
        throw new AppError('Contact not found', 404);
      }
      demoContacts[index] = {
        ...demoContacts[index],
        ...req.body,
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : demoContacts[index].company,
        updatedAt: new Date().toISOString()
      };
      res.json(demoContacts[index]);
      return;
    }

    const { Contact, Company } = await import('../models');
    const { logContactActivity } = await import('../services/activityService');

    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const previousData = contact.toJSON();
    await contact.update(req.body);

    await logContactActivity(
      contact.id,
      'updated',
      req.user?.id,
      `Contact "${contact.firstName} ${contact.lastName}" was updated`,
      { previousData, newData: req.body }
    );

    const fullContact = await Contact.findByPk(contact.id, {
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    });

    res.json(fullContact);
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoContacts.findIndex(c => c.id === req.params.id);
      if (index === -1) {
        throw new AppError('Contact not found', 404);
      }
      demoContacts.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Contact } = await import('../models');

    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    await contact.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
