import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { isDatabaseConnected } from '../config/database';
import { demoActivities } from '../services/demoData';

// Notes are now stored as Activities with type='note'

export const getNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId, companyId, dealId } = req.query;

    if (!isDatabaseConnected) {
      let filtered = demoActivities.filter(a => a.type === 'note');
      if (contactId) filtered = filtered.filter(a => a.contactId === contactId);
      if (companyId) filtered = filtered.filter(a => a.companyId === companyId);
      if (dealId) filtered = filtered.filter(a => a.dealId === dealId);
      res.json(filtered);
      return;
    }

    const { Activity, User } = await import('../models');

    const where: any = { type: 'note' };
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (dealId) where.dealId = dealId;

    const notes = await Activity.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const note = demoActivities.find(a => a.id === req.params.id && a.type === 'note');
      if (!note) {
        throw new AppError('Note not found', 404);
      }
      res.json(note);
      return;
    }

    const { Activity, User } = await import('../models');

    const note = await Activity.findOne({
      where: { id: req.params.id, type: 'note' },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId, companyId, dealId, description } = req.body;

    if (!isDatabaseConnected) {
      const newNote = {
        id: `demo-note-${Date.now()}`,
        type: 'note',
        contactId: contactId || null,
        companyId: companyId || null,
        dealId: dealId || null,
        taskId: null,
        emailId: null,
        createdBy: 'demo-user-id',
        description,
        metadata: null,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      demoActivities.push(newNote as any);
      res.status(201).json(newNote);
      return;
    }

    const { Activity, User } = await import('../models');

    const note = await Activity.create({
      type: 'note',
      contactId,
      companyId,
      dealId,
      description,
      createdBy: req.user?.id || 'system',
      timestamp: new Date(),
    });

    const fullNote = await Activity.findByPk(note.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(fullNote);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoActivities.findIndex(a => a.id === req.params.id && a.type === 'note');
      if (index === -1) {
        throw new AppError('Note not found', 404);
      }
      demoActivities[index] = {
        ...demoActivities[index],
        description: req.body.description,
      };
      res.json(demoActivities[index]);
      return;
    }

    const { Activity, User } = await import('../models');

    const note = await Activity.findOne({
      where: { id: req.params.id, type: 'note' },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Only allow the note creator to update
    if (note.createdBy !== req.user?.id) {
      throw new AppError('You can only edit your own notes', 403);
    }

    await note.update({ description: req.body.description });

    const fullNote = await Activity.findByPk(note.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(fullNote);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isDatabaseConnected) {
      const index = demoActivities.findIndex(a => a.id === req.params.id && a.type === 'note');
      if (index === -1) {
        throw new AppError('Note not found', 404);
      }
      demoActivities.splice(index, 1);
      res.status(204).send();
      return;
    }

    const { Activity } = await import('../models');

    const note = await Activity.findOne({
      where: { id: req.params.id, type: 'note' },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Only allow the note creator or admin to delete
    if (note.createdBy !== req.user?.id && req.user?.role !== 'admin') {
      throw new AppError('You can only delete your own notes', 403);
    }

    await note.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
