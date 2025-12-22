import { Request, Response, NextFunction } from 'express';
import { Note, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { logContactActivity, logDealActivity } from '../services/activityService';

export const getNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entityType, entityId } = req.query;

    if (!entityType || !entityId) {
      throw new AppError('entityType and entityId are required', 400);
    }

    const notes = await Note.findAll({
      where: {
        entityType: entityType as string,
        entityId: entityId as string,
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
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
    const note = await Note.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
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
    const note = await Note.create({
      ...req.body,
      userId: req.user?.id,
    });

    // Log activity based on entity type
    const description = `Note added: "${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}"`;

    if (note.entityType === 'contact') {
      await logContactActivity(note.entityId, 'note_added', req.user?.id, description);
    } else if (note.entityType === 'deal') {
      await logDealActivity(note.entityId, 'note_added', req.user?.id, description);
    }

    const fullNote = await Note.findByPk(note.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
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
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Only allow the note creator to update
    if (note.userId !== req.user?.id) {
      throw new AppError('You can only edit your own notes', 403);
    }

    await note.update({ content: req.body.content });

    const fullNote = await Note.findByPk(note.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName'] },
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
    const note = await Note.findByPk(req.params.id);

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // Only allow the note creator or admin to delete
    if (note.userId !== req.user?.id && req.user?.role !== 'admin') {
      throw new AppError('You can only delete your own notes', 403);
    }

    await note.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
