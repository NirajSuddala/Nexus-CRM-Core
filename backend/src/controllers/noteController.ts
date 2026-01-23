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
    const { contactId, companyId, dealId, entityType, entityId } = req.query;

    // Resolve entity IDs - support both direct IDs and entityType/entityId format
    let resolvedContactId = contactId as string | undefined;
    let resolvedCompanyId = companyId as string | undefined;
    let resolvedDealId = dealId as string | undefined;

    if (entityType && entityId) {
      if (entityType === 'contact') resolvedContactId = entityId as string;
      else if (entityType === 'company') resolvedCompanyId = entityId as string;
      else if (entityType === 'deal') resolvedDealId = entityId as string;
    }

    if (!isDatabaseConnected) {
      let filtered = demoActivities.filter(a => a.type === 'note');
      if (resolvedContactId) filtered = filtered.filter(a => a.contactId === resolvedContactId);
      if (resolvedCompanyId) filtered = filtered.filter(a => a.companyId === resolvedCompanyId);
      if (resolvedDealId) filtered = filtered.filter(a => a.dealId === resolvedDealId);
      res.json(filtered);
      return;
    }

    const { Activity, User } = await import('../models');

    const where: any = { type: 'note' };
    if (resolvedContactId) where.contactId = resolvedContactId;
    if (resolvedCompanyId) where.companyId = resolvedCompanyId;
    if (resolvedDealId) where.dealId = resolvedDealId;

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
    // Support both old format (contactId, dealId, description) and new format (entityType, entityId, content)
    const { content, entityType, entityId, contactId, companyId, dealId, description } = req.body;

    // Resolve the description (frontend sends 'content', but we store as 'description')
    const noteDescription = content || description;

    // Resolve entity IDs - support both direct IDs and entityType/entityId format
    let resolvedContactId = contactId || null;
    let resolvedCompanyId = companyId || null;
    let resolvedDealId = dealId || null;

    if (entityType && entityId) {
      if (entityType === 'contact') resolvedContactId = entityId;
      else if (entityType === 'company') resolvedCompanyId = entityId;
      else if (entityType === 'deal') resolvedDealId = entityId;
    }

    if (!isDatabaseConnected) {
      const newNote = {
        id: `demo-note-${Date.now()}`,
        type: 'note',
        contactId: resolvedContactId,
        companyId: resolvedCompanyId,
        dealId: resolvedDealId,
        taskId: null,
        emailId: null,
        createdBy: 'demo-user-id',
        description: noteDescription,
        content: noteDescription,
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
      contactId: resolvedContactId,
      companyId: resolvedCompanyId,
      dealId: resolvedDealId,
      description: noteDescription,
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
