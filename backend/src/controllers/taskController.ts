import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoTasks, demoContacts, demoDeals, demoActivities } from '../services/demoData';

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string || '').toLowerCase();
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const contactId = req.query.contactId as string;
    const dealId = req.query.dealId as string;

    if (!isDatabaseConnected) {
      let filtered = [...demoTasks];
      if (search) {
        filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
      }
      if (status) filtered = filtered.filter(t => t.status === status);
      if (priority) filtered = filtered.filter(t => t.priority === priority);
      if (contactId) filtered = filtered.filter(t => t.contactId === contactId);
      if (dealId) filtered = filtered.filter(t => t.dealId === dealId);

      // Add name property and fullName to contacts for frontend compatibility
      const tasksWithName = filtered.map(t => ({
        ...t,
        name: t.name || t.title,
        contact: t.contact ? { ...t.contact, fullName: t.contact.fullName || `${t.contact.firstName} ${t.contact.lastName}` } : null,
      }));

      res.json({
        tasks: tasksWithName,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limit),
        },
      });
      return;
    }

    const { Task, Contact, Deal, User } = await import('../models');
    const { Op } = await import('sequelize');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;

    const { rows: tasks, count } = await Task.findAndCountAll({
      where,
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [
        ['dueDate', 'ASC'],
        ['priority', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    res.json({
      tasks,
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

export const getUpcomingTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    if (!isDatabaseConnected) {
      const today = new Date();
      const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
      const upcoming = demoTasks.filter(t => {
        if (t.status === 'completed' || !t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= endDate;
      }).map(t => ({
        ...t,
        name: t.name || t.title,
        contact: t.contact ? { ...t.contact, fullName: t.contact.fullName || `${t.contact.firstName} ${t.contact.lastName}` } : null,
      }));
      res.json(upcoming);
      return;
    }

    const { Task, Contact, Deal, User } = await import('../models');
    const { Op } = await import('sequelize');

    const today = new Date();
    const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const tasks = await Task.findAll({
      where: {
        status: { [Op.ne]: 'completed' },
        dueDate: {
          [Op.between]: [today.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
        },
      },
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [
        ['dueDate', 'ASC'],
        ['priority', 'ASC'],
      ],
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getOverdueTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const today = new Date();
      const overdue = demoTasks.filter(t => {
        if (t.status === 'completed' || !t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).map(t => ({
        ...t,
        name: t.name || t.title,
        contact: t.contact ? { ...t.contact, fullName: t.contact.fullName || `${t.contact.firstName} ${t.contact.lastName}` } : null,
      }));
      res.json(overdue);
      return;
    }

    const { Task, Contact, Deal, User } = await import('../models');
    const { Op } = await import('sequelize');

    const today = new Date().toISOString().split('T')[0];

    const tasks = await Task.findAll({
      where: {
        status: { [Op.ne]: 'completed' },
        dueDate: { [Op.lt]: today },
      },
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [
        ['dueDate', 'ASC'],
        ['priority', 'ASC'],
      ],
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const task = demoTasks.find(t => t.id === req.params.id);
      if (!task) {
        throw new AppError('Task not found', 404);
      }

      // Get related contact and deal with proper structure
      const contact = task.contactId ? demoContacts.find(c => c.id === task.contactId) : null;
      const deal = task.dealId ? demoDeals.find(d => d.id === task.dealId) : null;

      const taskWithRelations = {
        ...task,
        name: task.name || task.title,
        contact: contact ? { ...contact, fullName: contact.fullName || `${contact.firstName} ${contact.lastName}` } : null,
        deal: deal || null,
      };

      res.json(taskWithRelations);
      return;
    }

    const { Task, Contact, Deal, User } = await import('../models');

    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Contact, as: 'contact' },
        { model: Deal, as: 'deal' },
        { model: User, as: 'assignee' },
      ],
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const newTask = {
        id: `demo-task-${Date.now()}`,
        ...req.body,
        title: req.body.name || req.body.title,
        status: req.body.status || 'todo',
        priority: req.body.priority || 'medium',
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : null,
        deal: req.body.dealId ? demoDeals.find(d => d.id === req.body.dealId) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoTasks.push(newTask);

      // Add activity for task creation
      const newActivity = {
        id: `demo-activity-${Date.now()}`,
        type: 'created',
        contactId: req.body.contactId || null,
        companyId: null,
        dealId: req.body.dealId || null,
        taskId: newTask.id,
        emailId: null,
        createdBy: 'demo-user-id',
        description: `Task "${newTask.title || newTask.name}" was created`,
        metadata: null,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      demoActivities.push(newActivity as any);

      res.status(201).json(newTask);
      return;
    }

    const { Task, Contact, Deal, User } = await import('../models');
    const { logTaskActivity } = await import('../services/activityService');

    const task = await Task.create({
      ...req.body,
      assignedTo: req.body.assignedTo || req.user?.id,
    });

    await logTaskActivity(
      task.id,
      'created',
      req.user?.id,
      `Task "${task.title}" was created`,
      undefined,
      task.dealId,
      task.contactId
    );

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullTask);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoTasks.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new AppError('Task not found', 404);
      }
      demoTasks[index] = {
        ...demoTasks[index],
        ...req.body,
        contact: req.body.contactId ? demoContacts.find(c => c.id === req.body.contactId) : demoTasks[index].contact,
        deal: req.body.dealId ? demoDeals.find(d => d.id === req.body.dealId) : demoTasks[index].deal,
        updatedAt: new Date().toISOString()
      };
      res.json(demoTasks[index]);
      return;
    }

    const { Task, Contact, Deal, User } = await import('../models');
    const { logTaskActivity } = await import('../services/activityService');

    const task = await Task.findByPk(req.params.id);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const previousData = task.toJSON();
    await task.update(req.body);

    await logTaskActivity(
      task.id,
      'updated',
      req.user?.id,
      `Task "${task.title}" was updated`,
      { previousData, newData: req.body },
      task.dealId,
      task.contactId
    );

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: Contact, as: 'contact', attributes: ['id', 'firstName', 'lastName'] },
        { model: Deal, as: 'deal', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoTasks.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        throw new AppError('Task not found', 404);
      }
      demoTasks.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Task } = await import('../models');

    const task = await Task.findByPk(req.params.id);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await task.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getTaskStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const stats = ['todo', 'in_progress', 'completed'].map(status => ({
        status,
        count: demoTasks.filter(t => t.status === status).length,
      }));
      res.json(stats);
      return;
    }

    const { Task } = await import('../models');
    const sequelize = (await import('../config/database')).default;

    const stats = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};
