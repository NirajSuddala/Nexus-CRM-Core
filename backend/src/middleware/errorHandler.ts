import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = (err as any).errors?.map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      error: 'Validation error',
      details: errors,
    });
    return;
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      error: 'Resource already exists',
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
};
