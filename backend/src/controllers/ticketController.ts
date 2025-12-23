import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoTickets, demoCompanies, demoContacts } from '../services/demoData';

export const getTickets = async (
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
    const priority = req.query.priority as string;
    const companyId = req.query.companyId as string;
    const contactId = req.query.contactId as string;
    const projectId = req.query.projectId as string;
    const assignedTo = req.query.assignedTo as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoTickets];
      if (search) {
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(search) ||
          (t.description && t.description.toLowerCase().includes(search))
        );
      }
      if (type) filtered = filtered.filter(t => t.type === type);
      if (status) filtered = filtered.filter(t => t.status === status);
      if (priority) filtered = filtered.filter(t => t.priority === priority);
      if (companyId) filtered = filtered.filter(t => t.companyId === companyId);
      if (contactId) filtered = filtered.filter(t => t.contactId === contactId);
      if (projectId) filtered = filtered.filter(t => t.projectId === projectId);
      if (assignedTo) filtered = filtered.filter(t => t.assignedTo === assignedTo);

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      res.json({
        tickets: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Ticket, Company, Contact, Project, User } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;
    if (projectId) where.projectId = projectId;
    if (assignedTo) where.assignedTo = assignedTo;

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [
        ['priority', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    res.json({
      tickets,
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

export const getTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const ticket = demoTickets.find(t => t.id === req.params.id);
      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }
      res.json(ticket);
      return;
    }

    const { Ticket, Company, Contact, Project, User } = await import('../models');

    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'company' },
        { model: Contact, as: 'contact' },
        { model: Project, as: 'project' },
        { model: User, as: 'assignee' },
        { model: User, as: 'creator' },
      ],
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newTicket = {
        id: `demo-ticket-${Date.now()}`,
        ...req.body,
        status: req.body.status || 'open',
        priority: req.body.priority || 'medium',
        createdBy: 'demo-user-id',
        company: req.body.companyId ? demoCompanies.find(c => c.id === req.body.companyId) : null,
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoTickets.push(newTicket as any);
      res.status(201).json(newTicket);
      return;
    }

    const { Ticket, Company, Contact, Project, User } = await import('../models');

    const ticket = await Ticket.create({
      ...req.body,
      createdBy: req.user?.id || 'system',
    });

    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullTicket);
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoTickets.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new AppError('Ticket not found', 404);
      }
      demoTickets[index] = {
        ...demoTickets[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      res.json(demoTickets[index]);
      return;
    }

    const { Ticket, Company, Contact, Project, User } = await import('../models');

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    await ticket.update(req.body);

    const fullTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullTicket);
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoTickets.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new AppError('Ticket not found', 404);
      }
      demoTickets.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Ticket } = await import('../models');

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    await ticket.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getTicketStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const stats = {
        byStatus: {
          open: demoTickets.filter(t => t.status === 'open').length,
          in_progress: demoTickets.filter(t => t.status === 'in_progress').length,
          waiting_on_client: demoTickets.filter(t => t.status === 'waiting_on_client').length,
          resolved: demoTickets.filter(t => t.status === 'resolved').length,
          closed: demoTickets.filter(t => t.status === 'closed').length,
        },
        byPriority: {
          urgent: demoTickets.filter(t => t.priority === 'urgent').length,
          high: demoTickets.filter(t => t.priority === 'high').length,
          medium: demoTickets.filter(t => t.priority === 'medium').length,
          low: demoTickets.filter(t => t.priority === 'low').length,
        },
        byType: {
          bug: demoTickets.filter(t => t.type === 'bug').length,
          feature_request: demoTickets.filter(t => t.type === 'feature_request').length,
          support: demoTickets.filter(t => t.type === 'support').length,
          change_request: demoTickets.filter(t => t.type === 'change_request').length,
          question: demoTickets.filter(t => t.type === 'question').length,
        },
        total: demoTickets.length,
      };
      res.json(stats);
      return;
    }

    const { Ticket } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const [statusStats, priorityStats, typeStats, total] = await Promise.all([
      Ticket.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Ticket.findAll({
        attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['priority'],
        raw: true,
      }),
      Ticket.findAll({
        attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['type'],
        raw: true,
      }),
      Ticket.count(),
    ]);

    res.json({
      byStatus: statusStats,
      byPriority: priorityStats,
      byType: typeStats,
      total,
    });
  } catch (error) {
    next(error);
  }
};
